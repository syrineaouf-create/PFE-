import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { Apprenant } from './apprenants/apprenant.entity';
import { Formateur } from './formateurs/formateur.entity';
import { Formation } from './formations/formation.entity';
import { Session } from './sessions/session.entity';
import { Admin } from './admins/admin.entity';
import { Cours } from './cours/cours.entity';

import { ApprenantsModule } from './apprenants/apprenant.module';
import { FormateursModule } from './formateurs/formateur.module';
import { FormationsModule } from './formations/formation.module';
import { SessionsModule } from './sessions/session.module';
import { CsvImportModule } from './csv-import/csv.import.module';
import { ChatModule } from './chat/chat.module';
import { AdminsModule } from './admins/admin.module';
import { CoursModule } from './cours/cours.module';
import { AuthModule } from './auth/auth.module';
import * as bcrypt from 'bcrypt';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'plateform_db',
      entities: [Apprenant, Formateur, Formation, Session, Admin, Cours],
      synchronize: true,
    }),

    ApprenantsModule,
    FormateursModule,
    FormationsModule,
    SessionsModule,
    CsvImportModule,
    ChatModule,
    AdminsModule,
    CoursModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
})
export class AppModule implements OnModuleInit {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      // Supprimer les contraintes UNIQUE problématiques sur la table apprenants
      // (apprenant_id et email peuvent être NULL pour les données CSV)
      const result = await this.dataSource.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'apprenants' AND constraint_type = 'UNIQUE'
      `);
      for (const row of result) {
        await this.dataSource.query(
          `ALTER TABLE apprenants DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`
        );
        console.log(`✅ Contrainte supprimée : ${row.constraint_name}`);
      }

      // Migration automatique des mots de passe (cryptage bcrypt)
      const tables = ['admins', 'apprenants', 'formateurs'];
      for (const tableName of tables) {
        
        try {
          const users = await this.dataSource.query(`SELECT id, mot_de_passe FROM ${tableName} WHERE mot_de_passe IS NOT NULL AND mot_de_passe NOT LIKE '$2b$%'`);
          
          if (users && users.length > 0) {
            console.log(`🔄 Cryptage des mots de passe en cours pour la table ${tableName} (${users.length} comptes)...`);
            for (const user of users) {
              const hashed = await bcrypt.hash(user.mot_de_passe, 10);
              await this.dataSource.query(`UPDATE ${tableName} SET mot_de_passe = $1 WHERE id = $2`, [hashed, user.id]);
            }
            console.log(`✅ Mots de passe de la table ${tableName} sécurisés.`);
          }
        } catch (e) {
          console.warn(`⚠ Erreur lors de la migration des mots de passe pour ${tableName}:`, e.message);
        }
      }

    } catch (e) {
      console.warn("⚠ Impossible de s'initialiser:", e.message);
    }
  }
}