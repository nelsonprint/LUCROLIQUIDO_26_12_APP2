backend:
  - task: "POST /api/markup-profile - Create markup profile"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Markup profile creation working correctly. Formula calculation verified: markup = ((1+X)*(1+Y)*(1+Z))/(1-I). Expected markup: 1.4547, Actual: 1.4547. Expected BDI: 45.47%, Actual: 45.47%. All calculations are accurate."

  - task: "GET /api/markup-profiles/{company_id} - List all profiles for a company"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Profile listing endpoint working correctly. Returns proper array of profiles with all required fields: id, company_id, year, month, markup_multiplier, bdi_percentage."

  - task: "GET /api/markup-profile/{company_id}/{year}/{month} - Get specific profile"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Specific profile retrieval working correctly. Returns exact profile matching company_id, year, and month parameters."

  - task: "GET /api/markup-profile/series/{company_id}?months=12 - Get series for donut chart"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Series endpoint working correctly. Returns exactly 12 items as requested. Each item contains required fields: month, year, month_num, markup, bdi, has_data. Perfect for chart visualization."

  - task: "POST /api/markup-profile/copy-previous - Copy previous month config"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Copy previous month functionality working correctly. Successfully copies configuration from month 11 to month 12. Verified that copied rates match source profile (indirects_rate: 0.12, financial_rate: 0.025, profit_rate: 0.18)."

  - task: "GET /api/markup-profile/current/{company_id} - Get current month profile"
    implemented: true
    working: true
    file: "server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "testing"
        comment: "✅ Current month profile endpoint working correctly. Returns proper markup_multiplier and bdi_percentage for current month calculations."

frontend:
  - task: "Dashboard shows Markup/BDI - Últimos 12 Meses section"
    implemented: false
    working: "NA"
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Frontend testing not performed as per system limitations. Only backend API testing completed."

  - task: "Click Configurar Markup opens modal"
    implemented: false
    working: "NA"
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Frontend testing not performed as per system limitations. Only backend API testing completed."

  - task: "Modal shows markup configuration fields"
    implemented: false
    working: "NA"
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Frontend testing not performed as per system limitations. Only backend API testing completed."

  - task: "Save configuration updates the chart"
    implemented: false
    working: "NA"
    file: "App.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Frontend testing not performed as per system limitations. Only backend API testing completed."

metadata:
  created_by: "testing_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "POST /api/markup-profile - Create markup profile"
    - "GET /api/markup-profiles/{company_id} - List all profiles for a company"
    - "GET /api/markup-profile/{company_id}/{year}/{month} - Get specific profile"
    - "GET /api/markup-profile/series/{company_id}?months=12 - Get series for donut chart"
    - "POST /api/markup-profile/copy-previous - Copy previous month config"
    - "GET /api/markup-profile/current/{company_id} - Get current month profile"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: "✅ ALL MARKUP/BDI BACKEND API TESTS PASSED! All 6 endpoints are working correctly: 1) Create markup profile with accurate formula calculation 2) List profiles with proper structure 3) Get specific profile by company/year/month 4) Get 12-month series for charts 5) Copy previous month configuration 6) Get current month profile. Formula verification confirmed: markup = ((1+X)*(1+Y)*(1+Z))/(1-I) with expected markup ≈ 1.4547 and BDI ≈ 45.47%. All endpoints return proper HTTP 200 responses with correct data structures. Ready for frontend integration."