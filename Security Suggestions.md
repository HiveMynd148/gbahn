# Database Security Audit Suggestions

During a comprehensive security audit of the **Gradbahn** project's database architecture, schema definitions, ORM layer, configuration, and background task layers, we analyzed multiple facets of data security, integrity, and access controls.

Below are the detailed audit findings along with actionable remediation suggestions to secure the project's data storage and access mechanisms.

---

## 🛠️ Security Findings & Suggestions

### 1. Hardcoded Secret Key and Credentials in Configuration Example
* **Location:** [`.env.example`](file:///d:/Gradbahn/.env.example) and [`backend/app/config.py`](file:///d:/Gradbahn/backend/app/config.py)
* **Risk Severity:** **High**
* **Finding:** 
  The default development credentials like `POSTGRES_PASSWORD=strongpassword123` and `SECRET_KEY=your-secret-key-here-change-in-production` are committed to version control. While `.env` is properly ignored in `.gitignore`, there are no programmatic checks in `config.py` to ensure that a secure, randomly-generated `SECRET_KEY` is enforced in staging or production environments.
* **Remediation Suggestions:**
  * Implement an environmental check in `config.py` that raises a startup error if `SECRET_KEY` is set to the default example value or is shorter than 32 characters in production.
  * Use a runtime validation tool or pre-start script to check that the database connection password does not match standard development placeholders.

---

### 2. Broad CORS Wildcard Permissions
* **Location:** [`backend/app/main.py`](file:///d:/Gradbahn/backend/app/main.py#L24-L36)
* **Risk Severity:** **Medium**
* **Finding:**
  The backend configures `CORSMiddleware` with `allow_origins=origins` where `origins` includes `*` (wildcard) alongside `"http://localhost:5173"` and `"http://localhost"`, while simultaneously setting `allow_credentials=True`. 
  > [!WARNING]
  > Under the CORS specification, configuring `allow_credentials=True` along with an explicit wildcard `"*"`, or reflecting wildcard request origins dynamically, can allow unauthorized external sites to execute cross-origin requests on behalf of authenticated users, rendering them vulnerable to Cross-Site Request Forgery (CSRF) or data exfiltration.
* **Remediation Suggestions:**
  * Avoid placing `"*"` in CORS origins when `allow_credentials=True` is enabled.
  * Configure environment-specific CORS policies: load permitted origins dynamically from environment variables (e.g., `CORS_ALLOWED_ORIGINS`) and fail securely if none are specified.

---

### 3. Password Hashing Configurations & Work Factor Tuning
* **Location:** [`backend/app/services/auth_service.py`](file:///d:/Gradbahn/backend/app/services/auth_service.py#L8)
* **Risk Severity:** **Medium**
* **Finding:**
  The password hashing mechanism uses `passlib`'s `CryptContext(schemes=["bcrypt"], deprecated="auto")`. While bcrypt is highly secure for password hashing, it relies on a cost factor (or number of rounds) to protect against modern GPU-accelerated brute-force attacks. Currently, no explicit cost factor is specified, which means passlib defaults to a potentially low work factor.
* **Remediation Suggestions:**
  * Explicitly set the work factor (number of rounds) for the bcrypt scheme in `CryptContext` to a value that balances verification latency with attack resistance (e.g., `12` or `13` rounds).
    ```python
    pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__rounds=12, deprecated="auto")
    ```

---

### 4. Direct/Unauthenticated Background Tasks endpoint
* **Location:** [`backend/app/routers/exchange_rates.py`](file:///d:/Gradbahn/backend/app/routers/exchange_rates.py#L26-L31)
* **Risk Severity:** **Low**
* **Finding:**
  The endpoint `/api/v1/exchange-rates/refresh` triggers a sync task to update local exchange rates. While comments indicate that "In a real app we might protect this to be admin-only", the route currently lacks any dependency on a permission check or authentication. This permits unauthorized clients to trigger external API calls to the Open Exchange Rates API, potentially exhausting API limits or causing Denial of Service (DoS) through resource exhaustion.
* **Remediation Suggestions:**
  * Secure the `/refresh` endpoint by attaching the `get_current_user` dependency or introducing an administrative role check.
  * Implement rate limiting on this endpoint using FastAPI middleware or a Redis-backed rate-limiter.

---

### 5. Foreign Key Cascades & Data Integrity Audit
* **Location:** [`backend/app/models/programme.py`](file:///d:/Gradbahn/backend/app/models/programme.py) and [`backend/app/models/dashboard.py`](file:///d:/Gradbahn/backend/app/models/dashboard.py)
* **Risk Severity:** **Low**
* **Finding:**
  Models like `Programme` cascade deletes to `RequiredDocument` and `Deadline` successfully. However, `UserDashboard` links to `User` without specifying `ondelete="CASCADE"` at the database constraints level:
  ```python
  user_id = Column(Uuid, ForeignKey("users.id"), unique=True, nullable=False)
  ```
  If a user profile is deleted from the `users` table, the corresponding `user_dashboard` row will cause a foreign key constraint violation unless manually managed, or will leave orphaned child items.
* **Remediation Suggestions:**
  * Add explicit `ondelete="CASCADE"` constraints to all user-linked tables, including `user_dashboard`, to let PostgreSQL handle cascades natively and prevent orphaned database entries.
  * Ensure that SQLAlchemy relationship cascading is aligned with database-level constraints.

---

### 6. Missing PostgreSQL Indexing on High-Frequency Columns
* **Location:** [`backend/app/models/programme.py`](file:///d:/Gradbahn/backend/app/models/programme.py#L14)
* **Risk Severity:** **Performance / Low**
* **Finding:**
  The `Programme` table is heavily queried and filtered using parameters like `nc_status`, `gre_required`, and `university_id`. Currently, only foreign keys have implicit database indexes, but frequently filtered columns like `nc_status` and `gre_required` lack explicit indexes, which may degrade query times as the dataset grows.
* **Remediation Suggestions:**
  * Add database indexes to high-frequency filter columns (`nc_status`, `gre_required`, and `federal_state` on `University`).
  * Monitor query execution plans under heavy loads using PostgreSQL `EXPLAIN ANALYZE`.
