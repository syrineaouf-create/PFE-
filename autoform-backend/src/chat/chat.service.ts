import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',
        systemInstruction: "Tu es WaialysBot, un expert senior en Industrie 4.0, Automatisme, systèmes SCADA, SolidWorks, EPLAN, Siemens TIA Portal et ingénierie industrielle. Tu agis également comme conseiller d'orientation expert pour le centre Waialys Formation.\n\nRÈGLE ABSOLUE ET STRICTE : Tu dois UNIQUEMENT répondre aux questions concernant l'industrie, la mécanique, l'électronique, l'automatisme et nos formations professionnelles. Si l'utilisateur pose une question hors de ce cadre (cuisine, politique, cinéma, etc.), TU DOIS ABSOLUMENT RÉPONDRE : 'Désolé, je suis uniquement programmé pour répondre à des questions liées à l'industrie, à l'automatisme, et aux formations Waialys.'\n\nRÈGLE D'ORIENTATION (CONSEIL CLIENT) : Si l'utilisateur te parle de lui (son profil, son niveau, ses objectifs ou son métier), tu dois L'ÉCOUTER et LUI RECOMMANDER la ou les formations les plus adaptées parmi notre catalogue exclusif : 'SCADA', 'Industrie 4.0', 'EPLAN', 'SolidWorks', ou 'TIA Portal'. Rédige un message poli, encourageant et explique-lui concrètement pourquoi ce programme Waialys spécifique lui sera bénéfique pour sa carrière.",
      });
    }
  }

  async generateResponse(message: string, history: any[] = []): Promise<string> {
    if (!this.genAI || !this.model) {
      return "⚠️ **Hors ligne** : WaialysBot n'est pas activé. Veuillez ajouter `GEMINI_API_KEY` dans le fichier `.env` du backend de la plateforme pour m'éveiller.";
    }

    try {
      // Nettoyer l'historique pour l'API Gemini
      // Format attendu par l'API SDK: { role: 'user' | 'model', parts: [{ text: '...' }] }
      const formattedHistory = (history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      // ⚠️ IMPORTANT: Google Gemini exige que l'historique commence par "user".
      // Puisque notre premier message sur l'interface est "Bonjour je suis WaialysBot" (model),
      // cela fait crasher l'historique. On doit donc supprimer les messages 'model' au tout début.
      while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
      }

      // Lancer le chat avec le contexte précédent
      const chat = this.model.startChat({
        history: formattedHistory,
      });

      // Envoyer le nouveau message
      const result = await chat.sendMessage(message);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Désolé, mes circuits industriels sont encombrés. J'ai rencontré une erreur lors du traitement de votre demande. (Vérifiez la console du serveur)";
    }
  }
}
