async function populate() {
  try {
    const res = await fetch('http://localhost:3000/apprenants?limit=5000');
    const json = await res.json();
    const apprenants = json.data || [];
    
    const uniqueTitles = [...new Set(apprenants.map(a => a.formation).filter(Boolean))];
    console.log('Found unique formations in apprenants:', uniqueTitles);
    
    const existingRes = await fetch('http://localhost:3000/formations');
    const existingJson = await existingRes.json();
    const existingTitles = (existingJson.data || existingJson || []).map(f => f.titre);
    
    for (const title of uniqueTitles) {
      if (!existingTitles.includes(title)) {
        await fetch('http://localhost:3000/formations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            titre: title,
            duree: '5 jours',
            prix: null,
            statut: 'Active'
          })
        });
        console.log(`Added formation: ${title}`);
      }
    }
    
    console.log('Done populating formations from initial DB!');
  } catch(e) {
    console.error('Error:', e.message);
  }
}

populate();
