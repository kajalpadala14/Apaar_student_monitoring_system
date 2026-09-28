# Dantewada APAAR Pending Survey Portal
### *APAAR ID Pending Student Survey – District Dantewada, Chhattisgarh*
### *स्कूल शिक्षा विभाग, जिला दंतेवाड़ा, छत्तीसगढ़*

---

## 📌 Overview
The **Dantewada APAAR Pending Survey Portal** is a government-style monitoring and survey application designed specifically for the School Education Department, District Administration Dantewada, Chhattisgarh.

It directly utilizes the master dataset from **`APAAR Database.xlsx`** containing **9,747 pending student records** across 4 administrative blocks:
1. **DANTEWADA** – 2,320 students
2. **GEEDAM** – 3,939 students
3. **KUAKONDA** – 2,248 students
4. **KATEKALYAN** – 1,240 students

---

## 🎯 Key Objectives & Workflow
Identify why each student's APAAR ID has not been generated, check Aadhaar document availability, and record necessary remediation actions.

```
Excel Student Master Data (9,747 Records)
             ↓
Pending Student List & Block Aggregations
             ↓
Open Student Profile
             ↓
Conduct Survey (Quick Survey Mode: 30–60s)
  ├── Section A: Select Reason (Mismatch / Not Available / Consent / etc.)
  ├── Section B: Check Required Aadhaar Documents (YES / NO / NOT SURE)
  ├── Section C: Select Available Documents (Birth Certificate / School ID / etc.)
  └── Additional: Action Required, Remarks & Status
             ↓
Save & Next Student (Auto-opens next pending student)
```

---

## 🚀 Key Features

1. **Exact 19-Column Master Excel Alignment**:
   - Matches Hindi and English column mappings: `ब्लॉक का नाम`, `संकुल का नाम`, `श्रेणी`, `स्कूल का नाम`, `UDISE Code`, `कक्षा`, `Section`, `विद्यार्थी का पेन नंबर`, `विद्यार्थी का नाम (मार्कशीट के अनुसार)`, `अपार आईडी नहीं बनने का कारण`, `क्या विद्यार्थी के पास आधार बनाने या सुधार हेतु आवश्यक दस्तावेज उपलब्ध हैं ?`, `यदि हाँ तो कौन सा दस्तावेज उपलब्ध हैं`.
2. **Dynamic KPI Dashboard**:
   - Zero hardcoding — all stats (Total Students, Survey Completed, Survey Pending, Completion %) are dynamically aggregated from active records.
   - Interactive Block-wise progress table with progress bars.
   - Live Reason-wise pending analysis chart.
   - Live filter bar (Block, Sankul, School, Class, Survey Status).
3. **Search & Master Students List**:
   - Real-time search by Student Name, PEN Number, School Name, UDISE Code, and Father Name (in English & Hindi).
   - Fast pagination and sorting.
   - Detailed Student Profile modal.
4. **Quick Survey Mode**:
   - Designed for fast fieldwork on laptops, tablets, and mobile phones.
   - Top progress bar tracking completion: e.g. `125 / 9747 Completed (1.3%)`.
   - `[ Save & Next Student ]` button automatically updates the student record and advances to the next un-surveyed student without unnecessary clicks.
5. **7 Standard Administrative Reports (Excel & PDF)**:
   - Block Wise Report
   - School Wise Report (724 Schools)
   - Reason Wise Report
   - Survey Status Report
   - Pending Survey Report
   - Completed Survey Report
   - Detailed Student Survey Master Report
   - Filter-aware exports in `.xlsx` and formatted `.pdf`.
6. **Admin Excel Import**:
   - Built-in `.xlsx`, `.xls`, `.csv` importer with Hindi column mapping.
   - Automated validation checking duplicate PENs, duplicate UDISE+Student combinations, and missing required fields.
   - Preview and confirmation modal before applying imports.
7. **Offline-First & Supabase Hybrid Architecture**:
   - Works immediately out of the box with browser IndexedDB, persisting all 9,747 student records offline.
   - Ready for Supabase PostgreSQL sync when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are provided.
   - Full PostgreSQL migration schema with RLS policies in `supabase/schema.sql`.

---

## 🛠️ Technology Stack
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS (Clean district-government aesthetic: Navy blue, slate, white, subtle badges)
- **Icons**: Lucide React
- **Data Engine**: SheetJS (`xlsx`), `jspdf`, `jspdf-autotable`
- **Storage**: IndexedDB (`idb`) + Supabase PostgreSQL (`@supabase/supabase-js`)

---

## 💻 Local Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🗄️ Supabase PostgreSQL Setup (Optional)
If deploying with a live cloud Supabase database:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. Add your project credentials to `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
5. The application will automatically synchronize changes to Supabase while retaining instant client responsiveness.
