// CTI Sustainability Data Checker Demo
// Simple front-end only logic, no external libraries required.

;(function(){
  const EXPECTED_COLUMNS = [
    'company',
    'year',
    'scope1_tco2e',
    'scope2_tco2e',
    'scope3_tco2e',
    'total_tco2e',
    'energy_mwh',
    'water_m3',
    'female_pct',
    'employee_count',
    'source',
  ]

  const SAMPLE_CSV = `company,year,scope1_tco2e,scope2_tco2e,scope3_tco2e,total_tco2e,energy_mwh,water_m3,female_pct,employee_count,source
Acme Bank,2023,1200,800,5600,7600,120000,34000,42,3200,Annual report 2023
Beta Insurance,2023,900,700,4100,5700,98000,21000,39,1800,Sustainability report 2023
Gamma Asset Mgmt,2023,500,400,2600,3500,64000,12000,51,900,TCFD update 2023
`;

  const SAMPLE_TEXT = `In 2023 our total greenhouse gas emissions (Scopes 1, 2 and 3) amounted to 7,600 tCO2e.
Scope 1 emissions were 1,200 tCO2e and Scope 2 emissions were 800 tCO2e.
Scope 3 emissions were 5,600 tCO2e. We used 120,000 MWh of energy during the year.
Women represented 42 percent of our workforce in 2023.`;

  let currentCsv = null; // { headers: string[], rows: object[] }

  function $(id){ return document.getElementById(id) }

  function setText(id, text){
    const el = $(id)
    if(el) el.textContent = text
  }

  function parseCSV(text){
    const cleaned = text.replace(/\r/g, '').trim()
    if(!cleaned){
      return { headers: [], rows: [] }
    }
    const lines = cleaned.split(/\n+/)
    const headers = lines[0].split(',').map(h => h.trim())
    const rows = []
    for(let i = 1; i < lines.length; i++){
      const line = lines[i]
      if(!line.trim()) continue
      const values = line.split(',')
      const row = {}
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim()
      })
      rows.push(row)
    }
    return { headers, rows }
  }

  function renderCsvSchema(){
    const el = $('csvSchema')
    if(!el) return
    el.textContent = EXPECTED_COLUMNS.join(', ')
  }

  function renderTable(headers, rows){
    const table = $('dataTable')
    if(!table) return
    const thead = table.querySelector('thead')
    const tbody = table.querySelector('tbody')
    thead.innerHTML = ''
    tbody.innerHTML = ''

    if(!headers.length || !rows.length){
      return
    }

    const trHead = document.createElement('tr')
    headers.forEach(h => {
      const th = document.createElement('th')
      th.textContent = h
      trHead.appendChild(th)
    })
    thead.appendChild(trHead)

    rows.forEach(r => {
      const tr = document.createElement('tr')
      headers.forEach(h => {
        const td = document.createElement('td')
        td.textContent = r[h] ?? ''
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
  }

  function addIssue(list, severity, message){
    list.push({ severity, message })
  }

  function validateRow(row){
    const issues = []

    // Required fields
    const required = ['company', 'year', 'total_tco2e']
    required.forEach(col => {
      if(!row[col]) addIssue(issues, 'high', `Missing value in "${col}"`)
    })

    // Numeric sanity checks
    const numericFields = ['scope1_tco2e','scope2_tco2e','scope3_tco2e','total_tco2e','energy_mwh','water_m3','female_pct']
    numericFields.forEach(col => {
      if(!row[col]) return
      const n = Number(String(row[col]).replace(/,/g,''))
      if(!Number.isFinite(n) || n < 0){
        addIssue(issues, 'medium', `Unexpected value in "${col}" (${row[col]})`)
      }
    })

    // Reconciliation check: Scope1 + Scope2 + Scope3 ≈ total
    const s1 = Number(row.scope1_tco2e || 0)
    const s2 = Number(row.scope2_tco2e || 0)
    const s3 = Number(row.scope3_tco2e || 0)
    const total = Number(row.total_tco2e || 0)
    if(total && (s1 || s2 || s3)){
      const sum = s1 + s2 + s3
      const diff = Math.abs(sum - total)
      if(diff > total * 0.15){
        addIssue(issues, 'medium', `Total emissions (${total}) do not align with Scopes 1–3 sum (${sum}).`)
      }
    }

    // Female percentage range
    if(row.female_pct){
      const f = Number(row.female_pct)
      if(f < 0 || f > 100){
        addIssue(issues, 'medium', `Female percentage outside 0–100 range (${row.female_pct}).`)
      }
    }

    return issues
  }

  function scoreFromIssues(issues){
    if(!issues.length) return 100
    let score = 100
    issues.forEach(i => {
      if(i.severity === 'high') score -= 12
      else if(i.severity === 'medium') score -= 6
      else score -= 3
    })
    return Math.max(40, score)
  }

  function renderIssuesList(issues){
    const el = $('issues')
    if(!el) return
    if(!issues.length){
      el.textContent = 'No issues found in this dataset.'
      return
    }
    const ul = document.createElement('ul')
    issues.forEach(i => {
      const li = document.createElement('li')
      li.textContent = `[${i.severity}] ${i.message}`
      ul.appendChild(li)
    })
    el.innerHTML = ''
    el.appendChild(ul)
  }

  function updateScore(score, issuesCount){
    const scoreEl = $('scoreValue')
    const labelEl = $('scoreLabel')
    if(!scoreEl || !labelEl) return

    scoreEl.textContent = String(score)

    let label
    if(!issuesCount) label = 'Excellent: no issues detected in this sample.'
    else if(score >= 85) label = 'Strong data quality with a few minor issues.'
    else if(score >= 70) label = 'Usable, but several issues should be reviewed.'
    else label = 'Needs attention: significant issues detected.'

    labelEl.textContent = label
  }

  function loadCsvFromText(text){
    const parsed = parseCSV(text)
    currentCsv = parsed
    renderTable(parsed.headers, parsed.rows)
    setText('scoreValue', '–')
    setText('scoreLabel', 'Upload data and run checks')
    setText('issues', 'No issues yet')
  }

  function runCsvChecks(){
    if(!currentCsv || !currentCsv.rows.length){
      setText('issues', 'Please load a CSV file first.')
      return
    }

    const allIssues = []
    currentCsv.rows.forEach((row, idx) => {
      const rowIssues = validateRow(row)
      rowIssues.forEach(i => {
        allIssues.push({ severity: i.severity, message: `Row ${idx+1}: ${i.message}` })
      })
    })

    const score = scoreFromIssues(allIssues)
    renderIssuesList(allIssues)
    updateScore(score, allIssues.length)
  }

  function clearCsv(){
    currentCsv = null
    const table = $('dataTable')
    if(table){
      table.querySelector('thead').innerHTML = ''
      table.querySelector('tbody').innerHTML = ''
    }
    setText('scoreValue', '–')
    setText('scoreLabel', 'Upload data and run checks')
    setText('issues', 'No issues yet')
  }

  // Report text helpers
  function extractFromText(text){
    const cleaned = text.replace(/\r/g, '')
    const out = {}

    const patterns = [
      ['scope1_tco2e', /(scope\s*1)[^\d]{0,40}([0-9][0-9,\. ]*)/i],
      ['scope2_tco2e', /(scope\s*2)[^\d]{0,40}([0-9][0-9,\. ]*)/i],
      ['scope3_tco2e', /(scope\s*3)[^\d]{0,40}([0-9][0-9,\. ]*)/i],
      ['total_tco2e', /(total\s*(emissions|ghg|co2e))[^\d]{0,40}([0-9][0-9,\. ]*)/i],
      ['energy_mwh', /(energy)[^\d]{0,40}([0-9][0-9,\. ]*)\s*(mwh|gwh)?/i],
      ['water_m3', /(water)[^\d]{0,40}([0-9][0-9,\. ]*)\s*(m3|m³)?/i],
      ['female_pct', /(women|female)[^\d]{0,40}([0-9][0-9,\. ]*)\s*%/i],
    ]

    function norm(raw){
      if(!raw) return NaN
      let s = String(raw).trim()
      s = s.replace(/\s/g,'')
      s = s.replace(/,/g,'')
      const n = Number(s)
      return Number.isFinite(n) ? n : NaN
    }

    for(const [key, re] of patterns){
      const m = cleaned.match(re)
      if(!m) continue
      const raw = m[m.length - 1]
      const n = norm(raw)
      if(Number.isFinite(n)) out[key] = n
    }

    const yearMatch = cleaned.match(/(20\d{2})/)
    if(yearMatch) out.year = Number(yearMatch[1])

    return out
  }

  function renderExtracted(extracted){
    const el = $('extracted')
    const notesEl = $('textIssues')
    if(!el || !notesEl) return

    const keys = Object.keys(extracted)
    if(!keys.length){
      el.textContent = 'Nothing extracted yet. Try including numbers for scopes, total emissions or gender balance.'
      notesEl.textContent = 'No metrics could be identified in the text.'
      return
    }

    const dl = document.createElement('dl')
    keys.forEach(k => {
      const dt = document.createElement('dt')
      dt.textContent = k
      const dd = document.createElement('dd')
      dd.textContent = String(extracted[k])
      dl.appendChild(dt)
      dl.appendChild(dd)
    })

    el.innerHTML = ''
    el.appendChild(dl)

    notesEl.textContent = 'These metrics are extracted heuristically from the text. In a real workflow they would be compared to structured disclosures and flagged where the model disagrees.'
  }

  function switchMode(mode){
    const csvPanel = $('panelCsv')
    const textPanel = $('panelText')
    const tabCsv = $('tabCsv')
    const tabText = $('tabText')

    if(mode === 'csv'){
      csvPanel.classList.remove('hidden')
      textPanel.classList.add('hidden')
      tabCsv.classList.add('active')
      tabText.classList.remove('active')
    } else {
      textPanel.classList.remove('hidden')
      csvPanel.classList.add('hidden')
      tabText.classList.add('active')
      tabCsv.classList.remove('active')
    }
  }

  function init(){
    renderCsvSchema()

    // Tabs
    $('tabCsv').addEventListener('click', () => switchMode('csv'))
    $('tabText').addEventListener('click', () => switchMode('text'))

    // CSV interactions
    $('loadSample').addEventListener('click', () => {
      loadCsvFromText(SAMPLE_CSV)
    })

    $('csvFile').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0]
      if(!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        loadCsvFromText(String(ev.target.result || ''))
      }
      reader.readAsText(file)
    })

    $('runChecks').addEventListener('click', runCsvChecks)
    $('clearCsv').addEventListener('click', clearCsv)

    // Text interactions
    $('extract').addEventListener('click', () => {
      const text = $('reportText').value || ''
      if(!text.trim()){
        $('extracted').textContent = 'Paste some report text first.'
        $('textIssues').textContent = 'No text analysed yet.'
        return
      }
      const extracted = extractFromText(text)
      renderExtracted(extracted)
    })

    $('loadSampleText').addEventListener('click', () => {
      $('reportText').value = SAMPLE_TEXT
    })

    $('clearText').addEventListener('click', () => {
      $('reportText').value = ''
      $('extracted').textContent = 'Nothing extracted yet'
      $('textIssues').textContent = 'No notes yet'
    })
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
