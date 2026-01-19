# Winner Security - Sistem za upravljanje smenama

Aplikacija za jednostavno upravljanje smenama radnika fizičko-tehničkog obezbeđenja. Omogućava administratoru da vodi evidenciju o radnicima, raspoređuje smene i prati radne sate – sve lokalno, bez potrebe za internetom ili eksternom bazom podataka (osim za pristup aplikaciji).

## 🌐 Link ka aplikaciji
[https://winner-security.vercel.app](https://winner-security.vercel.app)

## 🚀 Kako se koristi

1. **Prijava u sistem**
   - Korisničko ime: `admin`
   - Lozinka: `admin123`

2. **Upravljanje radnicima**
   - Idite na tab **Radnici**.
   - Dodajte radnike (unos samo imena).
   - Mogućnost brisanja radnika.

3. **Raspored smena (Kalendar)**
   - Idite na tab **Kalendar**.
   - Kliknite na datum za dodelu smene.
   - Prikaz smena po bojama (1, 2, 3. smena).
   - Klikom na postojeću smenu možete je obrisati.

4. **Istorija rada**
   - Tab **Istorija** omogućava detaljan pregled svih smena.
   - Filtriranje po radniku za jasan uvid u nečiji rad.

5. **Backup podataka (Sistem)**
   - Tab **Sistem** služi za čuvanje podataka.
   - **Export**: Preuzmite sve podatke u fajl na vaš uređaj.
   - **Import**: Učitajte podatke iz fajla (u slučaju promene uređaja ili brisanja keša).

## ⚠️ Važna napomena o podacima

Ova aplikacija koristi **Local Storage** vašeg pretraživača.
- Podaci su vezani za **uređaj i pretraživač** koji koristite.
- Podaci se **NE prenose** automatski na druge uređaje.
- Ako obrišete istoriju pregledanja (cache), podaci će se obrisati. **Zato redovno koristite opciju Backup u tabu Sistem!**

## 🛠️ Tehnologije

- **Frontend**: React + TypeScript (Vite)
- **Stilizacija**: Tailwind CSS + Shadcn UI
- **Pohrana**: LocalStorage (client-side database)
