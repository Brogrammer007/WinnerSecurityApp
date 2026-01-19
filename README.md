# Winner Security - Sistem za upravljanje smenama

Aplikacija za jednostavno upravljanje smenama radnika fizičko-tehničkog obezbeđenja. Omogućava administratoru da vodi evidenciju o radnicima, raspoređuje smene i prati radne sate – sve lokalno, bez potrebe za internetom ili eksternom bazom podataka.

## 🚀 Kako se koristi

1. **Prijava u sistem**
   - Korisničko ime: `admin`
   - Lozinka: `admin123`

2. **Upravljanje radnicima**
   - Idite na tab **Radnici**.
   - Kliknite na "Dodaj radnika" i unesite samo ime i prezime.
   - Radnika možete obrisati klikom na dugme "Obriši".

3. **Raspored smena (Kalendar)**
   - Idite na tab **Kalendar**.
   - Kliknite na bilo koji datum da biste otvorili meni.
   - Izaberite radnika i smenu (1, 2. ili 3. smena).
   - Za brisanje smene, kliknite ponovo na datum i koristite ikonicu kante 🗑️ pored imena radnika.

4. **Evidencija sati**
   - Tab **Sati** automatski prikazuje ukupan broj sati i smena za svakog radnika na osnovu unetog rasporeda.

## 🛠️ Tehnologije

Aplikacija je izrađena koristeći moderne veb tehnologije:

- **Frontend**: [React](https://react.dev/) sa [TypeScript](https://www.typescriptlang.org/) (build tool: Vite)
- **Stilizacija**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Komponente**: [Shadcn UI](https://ui.shadcn.com/)
- **Baza podataka**: **LocalStorage** (svi podaci se čuvaju u pretraživaču korisnika)
- **Ikone**: Lucide React

## 📦 Pokretanje projekta

```bash
# 1. Instalacija zavisnosti
npm install

# 2. Pokretanje razvojnog servera
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:8080`.
