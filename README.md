# APAAR Student Monitoring Dashboard – Dantewada

**District Administration Dantewada | School Education Department**  
Unified District & Block-level Student APAAR & Aadhaar Verification Monitoring Portal

---

## 1. Project Overview
A professional, government-style administration dashboard built for district and block-level education officers of Dantewada district (Chhattisgarh) to track student APAAR ID generation, Aadhaar availability, UIDAI demographic/biometric verification, and bottleneck root-cause analysis.

- **Total Records Loaded**: 10,043 students across 728 schools and 4 blocks (Dantewada, Geedam, Katekalyan, Kuakonda).
- **Data Source**: Official source file `APAAR DATA_SCHOOL EDUCATION.xlsx`.
- **Live Local URL**: `http://localhost:3000`

---

## 2. Key Architecture & Tech Stack
- **Frontend**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (Clean, official government portal UI design)
- **Data Engine**: Dexie.js (Embedded IndexedDB database supporting instant sub-millisecond filtering, search, and pagination across 10,040+ records)
- **Visualizations**: Recharts (Interactive Donut, Bar, Funnel, and Distribution charts)
- **Export Formats**: 
  - Excel (`.xlsx` via `xlsx`)
  - CSV (`.csv`)
  - Official Government PDF reports with seal and headers (`jspdf` + `jspdf-autotable`)
  - Print-ready stylesheets
- **PostgreSQL / Supabase**: Complete schema script available in `supabase/schema.sql` with tables for `users`, `blocks`, `schools`, `students`, `apaars`, `status_history`, `data_imports`, and `audit_logs`.

---

## 3. Core Modules & Features
1. **Executive Dashboard**:
   - 8 dynamic KPI cards (Total Students, Aadhaar Provided, Aadhaar Not Provided, Aadhaar Verified, Aadhaar Not Verified, APAAR Generated, APAAR Pending, Overall Completion %).
   - Action Required & Priority Directives (Critical, High, Medium actions for enrolment and verification camps).
   - Interactive charts: Click any bar or pie slice to dynamically filter the dashboard.

2. **Global Filter Bar**:
   - Filter by Block, School, UDISE Code, Class, Aadhaar Provided (YES/NO), Aadhaar Verified (YES/NO), APAAR Status, Pending Reason, and PEN/Student Name search.
   - 1-click Export to Excel, CSV, or PDF.

3. **Block-wise Monitoring**:
   - Comparative analytics table and charts across the 4 blocks of Dantewada.
   - Status indicators: Green (≥90%), Yellow (70-89%), Red (<70%).
   - Click any block to drill down into its schools.

4. **School-wise Monitoring**:
   - Searchable, sortable table for all 728 schools in Dantewada.
   - Highlights schools with low verification or missing Aadhaar.
   - Click any school to open the **School Detail View** with student roster.

5. **Student-Level Details**:
   - Searchable by 11-digit Student PEN or Name.
   - Interactive Student Modal to inspect student information, school management code, and record verified status or APAAR ID generation.

6. **Pending APAAR Module**:
   - Flow bottleneck funnel: Total Pending → Aadhaar Not Provided → Aadhaar Not Verified → Technical Reasons.
   - Reason-wise breakdown table with percentage, affected schools, and affected blocks.

7. **Reports Module**:
   - Standardized reports: District Summary, Block-wise Dossier, School-wise Roster, Pending APAAR Root-Cause, and Student Action List.
   - Export to Excel, CSV, PDF, and print.

---

## 4. How to Run & Build
```bash
# Start Development Server (Running on http://localhost:3000)
npm run dev

# Build Production Bundle
npm run build

# Preview Production Bundle
npm run preview
```
