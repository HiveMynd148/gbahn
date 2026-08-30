# Database Structural Audit & Schema Suggestions

A structural audit of the **Gradbahn** database schemas (SQLAlchemy models), data models, relationships, and data types has been performed. This audit aims to improve **data integrity, query performance, index coverage, and alignment with relational database design best practices**.

Below are the key structural findings, architectural risks, and suggested concrete solutions.

---

## 📐 Structural Audit Findings & Schema Optimization

### 1. Missing Indexes on Foreign Keys (FK)
* **Location:** [`backend/app/models/programme.py`](file:///d:/Gradbahn/backend/app/models/programme.py) & [`backend/app/models/transcript.py`](file:///d:/Gradbahn/backend/app/models/transcript.py)
* **Finding:**
  PostgreSQL automatically creates indexes for **Primary Keys** and **Unique Constraints**. However, it does **not** automatically index standard Foreign Keys. In Gradbahn, the following FK columns do not have explicit indexes:
  * `Deadline.programme_id`
  * `RequiredDocument.programme_id`
  * `TranscriptSubject.user_id`
  * `DashboardProgramme.programme_id` (only covered as the secondary column in the composite unique constraint `uq_dashboard_programme`)
* **Risk:**
  Whenever a user fetches a programme's details, the backend queries `RequiredDocument` and `Deadline` filtering by `programme_id`. Similarly, fetching a user's grades queries `TranscriptSubject` by `user_id`. As the database scales, these queries will perform expensive **Full Table Scans**, degrading API latency.
* **Remediation Suggestions:**
  * Explicitly add `index=True` to standard foreign key columns in SQLAlchemy:
    ```python
    # Example in RequiredDocument
    programme_id = Column(Uuid, ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False, index=True)
    ```

---

### 2. Timezone-Naive vs Timezone-Aware Datetime Inconsistency
* **Location:** [`backend/app/models/programme.py`](file:///d:/Gradbahn/backend/app/models/programme.py#L77)
* **Finding:**
  System logging fields like `created_at` and `updated_at` are defined with timezone support:
  ```python
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  ```
  However, applicant application windows and academic deadlines in the `deadlines` table are timezone-naive:
  ```python
  portal_opens = Column(DateTime(timezone=False), nullable=True)
  application_deadline = Column(DateTime(timezone=False), nullable=True)
  ```
* **Risk:**
  Because the target applicants are international students in different global regions, timezone offsets are highly significant. Timezone-naive fields are interpreted using the database host server's local system timezone, which can cause deadline checks or remaining-time displays to be off by several hours.
* **Remediation Suggestions:**
  * Update `portal_opens` and `application_deadline` to use `DateTime(timezone=True)` to guarantee absolute consistency across all tables.
  * Standardize all datetime inputs and comparisons in the API layer using UTC.

---

### 3. Floating-Point Inprecision for Academic Grades & ECTS Credits
* **Location:** [`backend/app/models/transcript.py`](file:///d:/Gradbahn/backend/app/models/transcript.py#L6)
* **Finding:**
  Academic grades, credit configurations, and subject grades are stored using the `Float` datatype:
  ```python
  degree_years = Column(Float, nullable=False, default=4.0)
  total_local_credits = Column(Float, nullable=False, default=160.0)
  credits = Column(Float, nullable=False)
  grade = Column(Float, nullable=False)
  ```
* **Risk:**
  The `Float` data type implements binary floating-point arithmetic (IEEE 754). This is subject to representation and rounding errors (e.g. `2.3` could be stored as `2.299999952316284`). Academic suitability conversions (like the Bavarian Formula) require exact decimal division and comparison. Small float precision discrepancies can lead to incorrect grade calculations or eligibility evaluation failures.
* **Remediation Suggestions:**
  * Migrate credit, grading scale, and grade values from `Float` to `Numeric(precision=4, scale=2)` or `Numeric(precision=5, scale=2)` to ensure exact decimal precision.
    ```python
    credits = Column(Numeric(precision=5, scale=2), nullable=False)
    grade = Column(Numeric(precision=4, scale=2), nullable=False)
    ```

---

### 4. Overuse of Text Fields for Low-Cardinality Enums
* **Location:** [`backend/app/models/programme.py`](file:///d:/Gradbahn/backend/app/models/programme.py#L14)
* **Finding:**
  Multiple categorical variables are represented as standard `String` columns rather than database Enums or dedicated lookup tables:
  * `Programme.nc_status` (Stores `'NC_FREE'`, `'LOCAL_NC'`)
  * `Programme.application_route` (Stores `'DIRECT'`, `'UNI_ASSIST'`)
  * `Deadline.semester` (Stores `'WINTER'`, `'SUMMER'`)
* **Risk:**
  Plain `String` columns permit typographical errors at the database level (e.g., `'Winter'`, `'WS'`, or `'winter'`) and lack constraint checks. This bypasses the validation advantages of an RDBMS and leads to brittle code when querying or filtering.
* **Remediation Suggestions:**
  * Leverage SQLAlchemy and PostgreSQL `Enum` classes for low-cardinality fixed categories. For example, convert `Semester` into a reusable Enum:
    ```python
    import enum
    class SemesterType(str, enum.Enum):
        WINTER = "WINTER"
        SUMMER = "SUMMER"
        
    # In Deadline model
    semester = Column(Enum(SemesterType, name="semester_type"), nullable=False)
    ```

---

### 5. Highly Nested JSONB Field for Core Quantitative Filters
* **Location:** [`backend/app/models/programme.py`](file:///d:/Gradbahn/backend/app/models/programme.py#L66)
* **Finding:**
  The `Programme` table absorbs polymorphic university entry criteria in a unified `requirements` `JSONB` column.
  While JSONB is highly efficient, core quantitative variables (like subject-specific ECTS requirements: `math`, `cs`, `theoretical_cs`, `practical_cs`) are deeply nested inside the JSON structure.
* **Risk:**
  If a student wants to query programmes where `"Math ECTS >= 15"`, the database must parse the JSON tree at runtime. This prevents index utilization (unless a complex JSONB path index is manually maintained) and requires complex path queries (`requirements->'quantitative'->'ects_thresholds'->>'math'`) in place of standard relational queries.
* **Remediation Suggestions:**
  * **Hybrid Strategy:** Promote high-frequency structured quantitative parameters to native columns on the `programmes` table (e.g., `required_math_ects`, `required_cs_ects`), while keeping unstructured qualitative descriptions or special equivalence clauses in the `JSONB` column.
  * Define database-level indexes on these native columns to allow fast, parameterized range lookups.

---

### 6. Missing Precision & Scale on Exchange Rates
* **Location:** [`backend/app/models/exchange_rate.py`](file:///d:/Gradbahn/backend/app/models/exchange_rate.py#L12)
* **Finding:**
  The exchange rate table stores currency ratios using a generic `Numeric` field without defined parameters:
  ```python
  rate = Column(Numeric, nullable=False)
  ```
* **Risk:**
  Although PostgreSQL's unparameterized `Numeric` accommodates any numeric scale, it lacks explicit data validation and can lead to excessive storage size or float parsing scales in downstream consumers (like Python decimal conversion).
* **Remediation Suggestions:**
  * Parameterize the `rate` column with a sensible precision and scale suited for exchange rates (e.g., `Numeric(precision=12, scale=6)`), which can accommodate values as large as `999,999.999999` with extreme accuracy.

---

### 7. Logical Data Duplication & Vulnerable Ingestion Queries
* **Location:** [`backend/hydrate_db.py`](file:///d:/Gradbahn/backend/hydrate_db.py) and [`backend/app/models/programme.py`](file:///d:/Gradbahn/backend/app/models/programme.py)
* **Finding:**
  There are substantial data integrity risks regarding logical data duplication and corrupting data overwrites:
  * **Ingestion Wildcard Query Matching:** In `hydrate_db.py`, queries check for existing universities or programmes using a wildcard SQL query: `.filter(University.name.ilike(f"%{uni_name}%"))`. This performs a substring comparison rather than an exact match.
  * **Lack of Uniqueness Constraints on Programmes:** The `programmes` table has no unique constraint linking a university to a specific course name and degree type (e.g. `(university_id, name, degree_type)`).
  * **Lack of Constraints on Deadlines & Required Documents:** The child relation tables do not enforce any unique key mappings at the database tier.
  * **Lack of Transcript Subject Constraints:** The `transcript_subjects` table does not enforce uniqueness, allowing users to enter identical subjects multiple times.
* **Risk:**
  * **Data Overwriting & Ingestion Collisions:** A wildcard matching query like `.ilike("%Technical University%")` will trigger false positives by matching *any* existing technical university (e.g. Dresden or Darmstadt) and linking new programs to the incorrect profile. For programmes, a wildcard search for "Artificial Intelligence" matches an existing "Applied Artificial Intelligence" record, overwriting it or skipping the new insertion entirely.
  * **Logical Duplicates:** Re-running the hydrator without `--overwrite` or through crashed partial updates can lead to duplicate deadlines, required documents, or programmes under slightly different names.
  * **Transcript GPA Distortion:** Lack of unique subject checks enables duplication of courses on a student's transcript, which artificially inflates or distorts credit aggregates and Bavarian Formula outputs.
* **Remediation Suggestions:**
  * **Convert Wildcard Searches to Strict Equality:** Avoid `ilike(f"%{name}%")` in the hydrator. Use strict, case-insensitive exact matching after passing names through the canonical `resolve_university_details` service.
  * **Introduce Composite Unique Constraints:** Enforce RDBMS-level unique constraints in the schema to block duplication:
    ```python
    # programmes Table Constraint
    __table_args__ = (
        UniqueConstraint('university_id', 'name', 'degree_type', name='uq_university_programme_degree'),
    )
    ```
    Similarly, implement unique checking on `(user_id, name)` for transcript subjects or validate uniqueness in the service layer before saving.

---

## ⚖️ Architectural Analysis: Flat Columns vs. Consolidated JSONB Requirements

A key architectural question has been raised: **Should all admissions requirements (language requirements, GRE, ECTS limits, etc.) be rolled up into a single consolidated JSONB column rather than maintained as separate relational columns?**

German university admissions rules are highly heterogeneous, making this a highly impactful design decision. Below is the structured analysis of this choice, along with our concrete recommendation.

### 1. Consolidating into JSONB: The Trade-offs

#### 🟢 The Pros (Flexibility & Decoupling)
* **Dynamic Schema Capability:** Avoid running migrations when a university introduces a unique rule (e.g., *"6-week mandatory pre-internship"*). Such entries are stored cleanly in JSON rather than creating sparse, mostly `NULL` table columns.
* **Ingestion Isolation:** Decoupled scraper/ingestion pipeline. Scraped payloads can be written directly to a single field, minimizing backend model updates.
* **Frontend Adaptability:** The frontend can dynamically render dynamic key-value pairs without hardcoding backend structure configurations.

#### 🔴 The Cons (Complexity & Degradation)
* **Data Consistency Drift:** No type-safety or syntax checking at the database tier. Typos like `"gre_requried": "Mandatory"` or varying types (`"gre_required": "Mandatory"` vs. `"gre_required": true`) will bypass validation, leading to silent data corruption.
* **Loss of SQL Indexing & Performance:** Filtering inside standard B-tree queries is disabled. Simple query filters (e.g. `total_ects_required >= 60`) will trigger expensive **Full Table Scans** unless customized Expression Indexes or large GIN indexes are manually maintained.
* **Brittle Querying Syntax:** SQLAlchemy queries become verbose and string-dependent:
  ```python
  query = query.filter(Programme.requirements['quantitative']['gre_required'].astext == gre_required)
  ```
* **API & Frontend Breakages:** Deleting flat columns breaks Pydantic validation structures (`ProgrammeResponse`) and direct JavaScript references unless complex hybrid property getters are written in Python.

---

### 2. The Recommended Architectural Compromise: **The Hybrid Schema**

To achieve the performance benefits of relational indexing while retaining dynamic schema capabilities, we recommend adopting a **semi-structured hybrid approach**:

* **Relational Columns for "Core Search Filters":**
  Maintain explicit, indexed, typed table columns for criteria that are heavily searched, aggregated, or compared in calculations:
  * **`gre_required`** (highly filtered UI parameter)
  * **`nc_status`** (highly filtered UI parameter)
  * **`min_gpa_german_scale`** (constantly compared for Bavarian Formula validations)
  * **`tuition_fee_per_semester` / `is_free_tuition`** (essential financial tracking filters)

* **JSONB Field for "Dynamic Rules Details":**
  Divert highly variable, program-specific, or qualitative criteria into the `requirements` JSONB column (useful for details display rather than primary list sorting):
  * Domain-specific ECTS thresholds (e.g., math, CS, theoretical CS limits).
  * Vague equivalence clauses and syllabus matching parameters.
  * Conditional admission notes and contingency details.

---

### 3. Implementation Strategy for a Consolidated JSONB Model

If you decide to proceed with rolling up all requirements into a single JSONB column, it must be executed carefully to prevent breaking the system:

1. **Write an Alembic Data Migration:**
   Create an Alembic migration that programmatically aggregates data from the flat columns, structures it into a standard JSON schema, commits it into `requirements`, and then drops the redundant columns.
2. **Implement SQLAlchemy `@hybrid_property` Descriptors:**
   To keep the codebase fully backwards-compatible (preventing API, Pydantic, and frontend breakages), implement hybrid property getters on the `Programme` SQLAlchemy model to map the internal JSON structure dynamically to standard object properties:
   ```python
   class Programme(Base):
       # ... Only requirements JSONB is defined in DB ...
       requirements = Column(JSONB, nullable=True)

       @property
       def gre_required(self) -> str:
           if not self.requirements:
               return "Not Required"
           return self.requirements.get("quantitative", {}).get("gre_required", "Not Required")

       @gre_required.setter
       def gre_required(self, value: str):
           if not self.requirements:
               self.requirements = {}
           if "quantitative" not in self.requirements:
               self.requirements["quantitative"] = {}
           self.requirements["quantitative"]["gre_required"] = value
   ```


