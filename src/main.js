import './style.css'

const STORAGE_KEY = 'northstar-customers-v1'

const seedCustomers = [
  { id: 'C-10482', name: 'Aino Lehtinen', segment: 'Private', status: 'Active', accounts: 3, balance: 42850.20, phone: '+358 40 555 0142', email: 'aino.lehtinen@example.com', city: 'Helsinki', joined: '2018-04-12', risk: 'Low' },
  { id: 'C-10731', name: 'Mikael Korhonen', segment: 'Private', status: 'Review', accounts: 2, balance: 12640.75, phone: '+358 50 555 0198', email: 'mikael.k@example.com', city: 'Espoo', joined: '2020-09-23', risk: 'Medium' },
  { id: 'C-10809', name: 'Nordhavn Logistics Oy', segment: 'Business', status: 'Active', accounts: 5, balance: 384291.00, phone: '+358 9 555 1220', email: 'finance@nordhavn.example', city: 'Vantaa', joined: '2016-01-30', risk: 'Low' },
  { id: 'C-10914', name: 'Elina Nieminen', segment: 'Private', status: 'Blocked', accounts: 1, balance: 940.42, phone: '+358 44 555 7311', email: 'elina.n@example.com', city: 'Turku', joined: '2022-11-05', risk: 'High' },
  { id: 'C-11027', name: 'Lakeview Foods Ab', segment: 'Business', status: 'Review', accounts: 4, balance: 97820.60, phone: '+358 2 555 3304', email: 'office@lakeview.example', city: 'Tampere', joined: '2019-06-14', risk: 'Medium' },
  { id: 'C-11103', name: 'Oskari Maki', segment: 'Private', status: 'Active', accounts: 2, balance: 18704.11, phone: '+358 45 555 8820', email: 'oskari.maki@example.com', city: 'Oulu', joined: '2023-02-18', risk: 'Low' },
]

let customers = loadCustomers()
let selectedId = customers[0]?.id ?? null
let query = ''
let statusFilter = 'All'

document.querySelector('#app').innerHTML = `
  <div class="terminal-shell">
    <header class="masthead">
      <div class="brand-mark" aria-hidden="true">NSBK</div>
      <div class="brand-copy">
        <strong>CUSTOMER INFORMATION SYSTEM</strong>
        <span>TRANSACTION: CUST01</span>
      </div>
      <div class="session-info">
        <span>TERM: HLS0147</span>
        <span>DATE: <b id="clock"></b></span>
      </div>
    </header>

    <nav class="function-bar" aria-label="Terminal functions">
      <span class="screen-location">NORTHSTAR / CICS / CUSTOMER MASTER</span>
      <span class="operator">OPERATOR: 0147</span>
    </nav>

    <main>
      <section class="screen-heading">
        <div>
          <p class="screen-code">MAP: CUSTM01</p>
          <h1>Customer Master File</h1>
        </div>
        <button class="primary-action" data-action="new">F2: ADD CUSTOMER</button>
      </section>

      <section class="summary-strip" aria-label="Customer summary">
        <div><span>TOTAL RECORDS</span><strong id="total-count">0</strong></div>
        <div><span>ACTIVE</span><strong id="active-count">0</strong></div>
        <div><span>UNDER REVIEW</span><strong id="review-count">0</strong></div>
        <div><span>TOTAL DEPOSITS</span><strong id="balance-total">EUR 0</strong></div>
      </section>

      <section class="command-line">
        <label for="search">COMMAND / SEARCH</label>
        <div class="command-input">
          <span aria-hidden="true">&gt;</span>
          <input id="search" type="search" autocomplete="off" placeholder="NAME, CUSTOMER ID, CITY OR COMMAND..." />
          <span class="cursor" aria-hidden="true"></span>
        </div>
        <button id="clear-search" title="Clear search" aria-label="Clear search">CLEAR</button>
      </section>

      <div class="workspace">
        <section class="records-panel">
          <div class="panel-toolbar">
            <h2>Customer records</h2>
            <div class="filter-group" aria-label="Filter by customer status">
              ${['All', 'Active', 'Review', 'Blocked'].map((status) => `<button data-filter="${status}" class="${status === 'All' ? 'active' : ''}">${status.toUpperCase()}</button>`).join('')}
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Customer name</th><th>Segment</th><th>Status</th><th>Accounts</th><th class="numeric">Balance EUR</th></tr></thead>
              <tbody id="customer-rows"></tbody>
            </table>
            <div id="empty-state" class="empty-state" hidden>NO MATCHING RECORDS. CHECK SEARCH PARAMETERS.</div>
          </div>
          <div class="table-footer"><span id="record-range">SHOWING 0 RECORDS</span><span>SELECT ROW FOR DETAILS</span></div>
        </section>

        <aside class="details-panel" id="details-panel" aria-live="polite"></aside>
      </div>
    </main>

    <footer><button data-focus-search>F4:SEARCH</button><button data-action="new">F2:ADD</button><button data-action="edit">F6:MODIFY</button><button data-action="export">F9:EXPORT</button><span>F12:CANCEL</span><span class="footer-note">SYSTEM READY</span></footer>
  </div>

  <dialog id="customer-dialog">
    <form id="customer-form" method="dialog">
      <div class="dialog-heading">
        <div><span id="form-mode">NEW RECORD</span><h2>Customer details</h2></div>
        <button type="button" class="close-button" data-close aria-label="Close">X</button>
      </div>
      <input type="hidden" name="id" />
      <div class="form-grid">
        <label class="span-2">Customer / company name<input name="name" required maxlength="80" /></label>
        <label>Segment<select name="segment"><option>Private</option><option>Business</option></select></label>
        <label>Status<select name="status"><option>Active</option><option>Review</option><option>Blocked</option></select></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Phone<input name="phone" required /></label>
        <label>City<input name="city" required /></label>
        <label>Risk class<select name="risk"><option>Low</option><option>Medium</option><option>High</option></select></label>
        <label>Accounts<input name="accounts" type="number" min="0" max="99" value="1" required /></label>
        <label>Balance EUR<input name="balance" type="number" min="0" step="0.01" value="0" required /></label>
      </div>
      <div class="form-actions"><button type="button" class="secondary" data-close>CANCEL</button><button type="submit" class="primary-action">COMMIT RECORD</button></div>
    </form>
  </dialog>
  <div id="toast" role="status" aria-live="polite"></div>
`

const rows = document.querySelector('#customer-rows')
const detailsPanel = document.querySelector('#details-panel')
const searchInput = document.querySelector('#search')
const dialog = document.querySelector('#customer-dialog')
const form = document.querySelector('#customer-form')

function loadCustomers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedCustomers
  } catch {
    return seedCustomers
  }
}

function saveCustomers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

function escapeHtml(value) {
  const element = document.createElement('span')
  element.textContent = value
  return element.innerHTML
}

function formatMoney(value, decimals = 2) {
  return new Intl.NumberFormat('en-FI', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value)
}

function filteredCustomers() {
  const normalized = query.toLowerCase().trim()
  return customers.filter((customer) => {
    const matchesStatus = statusFilter === 'All' || customer.status === statusFilter
    const haystack = `${customer.id} ${customer.name} ${customer.city} ${customer.email}`.toLowerCase()
    return matchesStatus && haystack.includes(normalized)
  })
}

function render() {
  const visible = filteredCustomers()
  document.querySelector('#total-count').textContent = customers.length.toString().padStart(4, '0')
  document.querySelector('#active-count').textContent = customers.filter((customer) => customer.status === 'Active').length.toString().padStart(4, '0')
  document.querySelector('#review-count').textContent = customers.filter((customer) => customer.status === 'Review').length.toString().padStart(4, '0')
  document.querySelector('#balance-total').textContent = `EUR ${formatMoney(customers.reduce((sum, customer) => sum + customer.balance, 0), 0)}`
  document.querySelector('#record-range').textContent = `SHOWING ${visible.length} OF ${customers.length} RECORDS`
  document.querySelector('#empty-state').hidden = visible.length > 0

  rows.innerHTML = visible.map((customer) => `
    <tr data-id="${customer.id}" class="${customer.id === selectedId ? 'selected' : ''}" tabindex="0" aria-selected="${customer.id === selectedId}">
      <td class="id-cell">${customer.id}</td>
      <td><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.city)}</small></td>
      <td>${customer.segment.toUpperCase()}</td>
      <td><span class="status status-${customer.status.toLowerCase()}">${customer.status.toUpperCase()}</span></td>
      <td>${customer.accounts.toString().padStart(2, '0')}</td>
      <td class="numeric">${formatMoney(customer.balance)}</td>
    </tr>`).join('')

  renderDetails(customers.find((customer) => customer.id === selectedId))
}

function renderDetails(customer) {
  if (!customer) {
    detailsPanel.innerHTML = '<div class="no-selection">SELECT A CUSTOMER RECORD</div>'
    return
  }
  detailsPanel.innerHTML = `
    <div class="detail-heading"><span>RECORD ${customer.id}</span><span class="risk risk-${customer.risk.toLowerCase()}">${customer.risk.toUpperCase()} RISK</span></div>
    <div class="customer-title"><div>${customer.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><h2>${escapeHtml(customer.name)}</h2><span>${customer.segment.toUpperCase()} CUSTOMER</span></div>
    <dl>
      <div><dt>Customer ID</dt><dd>${customer.id}</dd></div>
      <div><dt>Status</dt><dd>${customer.status.toUpperCase()}</dd></div>
      <div><dt>Email</dt><dd>${escapeHtml(customer.email)}</dd></div>
      <div><dt>Phone</dt><dd>${escapeHtml(customer.phone)}</dd></div>
      <div><dt>Home branch</dt><dd>${escapeHtml(customer.city)}</dd></div>
      <div><dt>Customer since</dt><dd>${customer.joined}</dd></div>
    </dl>
    <div class="balance-block"><span>CONSOLIDATED BALANCE</span><strong>EUR ${formatMoney(customer.balance)}</strong><small>${customer.accounts} LINKED ACCOUNT${customer.accounts === 1 ? '' : 'S'}</small></div>
    <div class="detail-actions"><button data-action="edit">EDIT</button><button data-action="delete" class="danger">DELETE</button></div>`
}

function openForm(mode) {
  form.reset()
  form.elements.accounts.value = 1
  form.elements.balance.value = 0
  document.querySelector('#form-mode').textContent = mode === 'edit' ? `EDIT ${selectedId}` : 'NEW RECORD'
  if (mode === 'edit') {
    const customer = customers.find((item) => item.id === selectedId)
    if (!customer) return showToast('SELECT A RECORD FIRST')
    Object.entries(customer).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value
    })
  }
  dialog.showModal()
  requestAnimationFrame(() => form.elements.name.focus())
}

function nextCustomerId() {
  const highest = Math.max(10000, ...customers.map((customer) => Number(customer.id.replace(/\D/g, '')) || 0))
  return `C-${highest + 1}`
}

function handleAction(action) {
  if (action === 'new') openForm('new')
  if (action === 'edit') openForm('edit')
  if (action === 'delete') {
    const customer = customers.find((item) => item.id === selectedId)
    if (!customer || !confirm(`Delete ${customer.name} (${customer.id})?`)) return
    customers = customers.filter((item) => item.id !== selectedId)
    selectedId = customers[0]?.id ?? null
    saveCustomers()
    render()
    showToast('CUSTOMER RECORD DELETED')
  }
  if (action === 'export') exportCsv()
}

function exportCsv() {
  const headers = ['ID', 'Name', 'Segment', 'Status', 'Accounts', 'Balance', 'Email', 'Phone', 'City', 'Joined', 'Risk']
  const values = customers.map((customer) => [customer.id, customer.name, customer.segment, customer.status, customer.accounts, customer.balance, customer.email, customer.phone, customer.city, customer.joined, customer.risk])
  const csv = [headers, ...values].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  link.download = `northstar-customers-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  showToast('CUSTOMER FILE EXPORTED')
}

function showToast(message) {
  const toast = document.querySelector('#toast')
  toast.textContent = message
  toast.classList.add('visible')
  clearTimeout(showToast.timeout)
  showToast.timeout = setTimeout(() => toast.classList.remove('visible'), 2400)
}

document.addEventListener('click', (event) => {
  const row = event.target.closest('tr[data-id]')
  const action = event.target.closest('[data-action]')?.dataset.action
  const filter = event.target.closest('[data-filter]')?.dataset.filter
  if (row) {
    selectedId = row.dataset.id
    render()
  }
  if (action) handleAction(action)
  if (filter) {
    statusFilter = filter
    document.querySelectorAll('[data-filter]').forEach((button) => button.classList.toggle('active', button.dataset.filter === filter))
    render()
  }
  if (event.target.closest('[data-focus-search]')) searchInput.focus()
  if (event.target.closest('[data-close]')) dialog.close()
})

document.addEventListener('keydown', (event) => {
  const keys = { F2: 'new', F4: 'search', F6: 'edit', F9: 'export' }
  if (!keys[event.key]) return
  event.preventDefault()
  keys[event.key] === 'search' ? searchInput.focus() : handleAction(keys[event.key])
})

rows.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.target.matches('tr')) {
    selectedId = event.target.dataset.id
    render()
  }
})

searchInput.addEventListener('input', () => {
  query = searchInput.value
  render()
})

document.querySelector('#clear-search').addEventListener('click', () => {
  query = ''
  searchInput.value = ''
  searchInput.focus()
  render()
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const data = Object.fromEntries(new FormData(form))
  const existing = customers.find((customer) => customer.id === data.id)
  const customer = {
    id: existing?.id || nextCustomerId(),
    name: data.name.trim(),
    segment: data.segment,
    status: data.status,
    accounts: Number(data.accounts),
    balance: Number(data.balance),
    phone: data.phone.trim(),
    email: data.email.trim(),
    city: data.city.trim(),
    joined: existing?.joined || new Date().toISOString().slice(0, 10),
    risk: data.risk,
  }
  customers = existing ? customers.map((item) => item.id === customer.id ? customer : item) : [customer, ...customers]
  selectedId = customer.id
  saveCustomers()
  dialog.close()
  render()
  showToast(existing ? 'CUSTOMER RECORD UPDATED' : 'CUSTOMER RECORD CREATED')
})

function updateClock() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'medium', hour12: false }).format(new Date()).toUpperCase()
}

updateClock()
setInterval(updateClock, 1000)
render()
