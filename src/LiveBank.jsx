import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Avatar, Button, Divider, MenuItem, TextField, Tooltip,
} from '@mui/material';
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, Building2, CheckCircle2,
  ChevronRight, CircleHelp, CreditCard, Globe2, Home, Landmark,
  LogOut, Menu, RefreshCw, Send, ShieldCheck, Wallet, X,
} from 'lucide-react';
import { toPaise } from './amount';
import { configuredEndpoint, liveApi, parseEndpoint, readStorage, saveStorage } from './live-api';
import './live.css';

const money = minor => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format((minor || 0) / 100);
const time = value => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value)) : '—';
const statusNames = { ACTIVE: 'Active', PENDING: 'Pending', PROCESSING: 'Processing', COMPLETED: 'Successful', REJECTED: 'Failed', MANUAL_REVIEW: 'Under review' };
const rejectionNames = { INSUFFICIENT_FUNDS: 'Insufficient available balance', LIMIT_EXCEEDED: 'Transfer limit exceeded', DESTINATION_ACCOUNT_UNAVAILABLE: 'Destination account is unavailable', BANK_NOT_READY: 'Destination bank is not enabled for transfers' };
const byId = (directory, id) => directory.find(bank => bank.bankId === id)?.bankName || id || '—';
const navItems = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'accounts', label: 'My accounts', icon: Wallet },
  { id: 'transfer', label: 'Money transfer', icon: ArrowLeftRight },
  { id: 'activity', label: 'Transactions', icon: Activity },
  { id: 'directory', label: 'Bank directory', icon: Building2 },
];

function StatusChip({ status }) {
  const cls = ['COMPLETED', 'ACTIVE'].includes(status) ? 'success' : ['REJECTED', 'MANUAL_REVIEW'].includes(status) ? 'danger' : 'pending';
  return <span className={'status-pill ' + cls}><i />{statusNames[status] || status || 'Unknown'}</span>;
}

function Brand({ compact = false }) {
  return <div className={'brand-mark' + (compact ? ' compact' : '')}>
    <span className="brand-symbol"><Landmark size={21} strokeWidth={2.1} /></span>
    <span><b>CREDENZA</b><small>PRIVATE BANKING</small></span>
  </div>;
}

function TransferForm({ bank, accounts, directory, send, onDone }) {
  const [type, setType] = useState('interbank');
  const [from, setFrom] = useState('');
  const [destination, setDestination] = useState('');
  const [number, setNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sources = accounts.filter(account => account.status === 'ACTIVE');
  const fromId = sources.some(item => item.accountId === from) ? from : (sources[0]?.accountId || '');
  const routes = directory.filter(item => item.bankId !== bank.id && item.status === 'ACTIVE');
  const route = type === 'internal' ? bank.ifsc : (routes.some(item => item.ifsc === destination) ? destination : (routes[0]?.ifsc || ''));
  const target = directory.find(item => item.ifsc === route) || (type === 'internal' ? { bankId: bank.id, bankName: bank.name, ifsc: bank.ifsc, status: 'ACTIVE' } : null);
  const selectedSource = sources.find(item => item.accountId === fromId);

  async function submit(event) {
    event.preventDefault(); setError('');
    const amountMinor = toPaise(amount);
    if (!fromId || !target || !number.trim() || amountMinor === null) {
      setError('Choose an active source account, a participating destination bank, a destination account number and a valid amount.'); return;
    }
    if (amountMinor > (selectedSource?.availableMinor || 0)) { setError('The amount is greater than your available balance.'); return; }
    setBusy(true);
    try {
      const result = await send({ fromAccountId: fromId, destinationIfsc: route, destinationAccountNumber: number.trim(), amountMinor, currency: 'INR' });
      setNumber(''); setAmount('');
      onDone(result);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <div className="transfer-layout">
    <section className="surface transfer-surface">
      <div className="surface-heading"><div><span className="eyebrow">PAYMENTS</span><h2>Make a transfer</h2><p>Move money securely between participating test-network banks.</p></div><span className="heading-icon"><Send size={20}/></span></div>
      <form className="new-transfer-form" onSubmit={submit}>
        <div className="transfer-kind" role="group" aria-label="Transfer type">
          <button type="button" className={type === 'interbank' ? 'chosen' : ''} onClick={() => setType('interbank')} disabled={busy}><Globe2 size={17}/> To another bank</button>
          <button type="button" className={type === 'internal' ? 'chosen' : ''} onClick={() => setType('internal')} disabled={busy}><Landmark size={17}/> Within Credenza</button>
        </div>
        <TextField select fullWidth label="Pay from" value={fromId} onChange={e => setFrom(e.target.value)} disabled={busy || !sources.length}>
          {sources.map(account => <MenuItem key={account.accountId} value={account.accountId}>{account.label || 'Savings account'} · {account.accountNumber} · {money(account.availableMinor)}</MenuItem>)}
        </TextField>
        {type === 'interbank' ? <TextField select fullWidth label="Receiving bank" value={route} onChange={e => setDestination(e.target.value)} disabled={busy || !routes.length}>
          {routes.map(item => <MenuItem key={item.ifsc} value={item.ifsc}>{item.bankName} · {item.ifsc}</MenuItem>)}
        </TextField> : <div className="same-bank-route"><span className="route-icon"><Landmark size={18}/></span><span><b>Credenza Bank</b><small>{bank.ifsc} · Same-bank transfer</small></span><CheckCircle2 size={18}/></div>}
        <TextField fullWidth label="Beneficiary account number" value={number} onChange={e => setNumber(e.target.value)} disabled={busy} required inputProps={{ maxLength: 40, autoComplete: 'off' }} />
        <TextField fullWidth label="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} disabled={busy} required inputProps={{ inputMode: 'decimal', maxLength: 14 }} placeholder="0.00" />
        {selectedSource && <div className="available-note"><span>Available balance</span><b>{money(selectedSource.availableMinor)}</b></div>}
        {error && <Alert severity="error">{error}</Alert>}
        {!routes.length && type === 'interbank' && <Alert severity="warning">No active destination banks were returned by the SharedBank directory.</Alert>}
        <Button type="submit" variant="contained" size="large" fullWidth disabled={busy || !fromId || !target || !number.trim()} startIcon={<Send size={17}/>}>{busy ? 'Submitting securely…' : 'Review and submit transfer'}</Button>
        <p className="form-disclaimer"><ShieldCheck size={14}/> Transfer requests are validated by the SharedBank test network. Do not use for real funds.</p>
      </form>
    </section>
    <aside className="transfer-aside">
      <section className="surface transfer-info-card"><span className="eyebrow">TRANSFER ROUTE</span><h3>{type === 'internal' ? 'Within Credenza' : 'Interbank payment'}</h3>
        <div className="route-step"><span className="route-node source"><Landmark size={16}/></span><div><b>{bank.name}</b><small>{bank.id} · {bank.ifsc}</small></div></div>
        <div className="route-connector" />
        <div className="route-step"><span className="route-node destination"><Building2 size={16}/></span><div><b>{type === 'internal' ? 'Credenza account' : (target?.bankName || 'Choose a bank')}</b><small>{type === 'internal' ? bank.ifsc : (target?.ifsc || 'Select receiving bank')}</small></div></div>
        <Divider sx={{ my: 2, borderColor: '#e9edf4' }}/>
        <div className="info-row"><span>Network</span><b>SharedBank · Test</b></div><div className="info-row"><span>Currency</span><b>INR</b></div>
      </section>
      <section className="security-note"><ShieldCheck size={20}/><div><b>Protected transfer flow</b><p>Requests use a unique idempotency key. A retry with the same request details will not intentionally create a second transfer.</p></div></section>
    </aside>
  </div>;
}

function TransactionsTable({ rows, directory }) {
  return <div className="table-wrap"><table className="modern-table"><thead><tr><th>Transaction</th><th>Transfer route</th><th>Amount</th><th>Status</th></tr></thead><tbody>
    {rows.map(row => <tr key={row.transferId}><td><div className="table-primary"><span className={'table-icon ' + (row.direction === 'CREDIT' ? 'credit' : '')}>{row.direction === 'CREDIT' ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}</span><span><b>{row.transferId}</b><small>{time(row.createdAt)}</small></span></div></td>
      <td><b>{byId(directory, row.sourceBankId)} → {byId(directory, row.destinationBankId)}</b><small>{row.type === 'INTERNAL' ? 'Within bank' : row.direction === 'CREDIT' ? 'Incoming transfer' : 'Interbank transfer'}</small></td>
      <td><b className={row.direction === 'CREDIT' ? 'credit-text' : ''}>{row.direction === 'CREDIT' ? '+' : '−'}{money(row.amountMinor)}</b></td>
      <td><StatusChip status={row.status}/>{row.code && <small className="status-detail">{rejectionNames[row.code] || row.code.toLowerCase().replaceAll('_', ' ')}</small>}</td></tr>)}</tbody></table></div>;
}

function EmptyState({ icon: Icon = Activity, title, detail }) {
  return <div className="empty-state"><span><Icon size={24}/></span><b>{title}</b><p>{detail}</p></div>;
}

function Overview({ bank, data, directory, go, onRefresh, busy }) {
  const accounts = data.accounts || [];
  const total = accounts.reduce((sum, a) => sum + (a.availableMinor || 0), 0);
  const held = accounts.reduce((sum, a) => sum + (a.heldMinor || 0), 0);
  const rows = (data.transfers || []).slice(0, 5);
  return <>
    <div className="welcome-row"><div><span className="eyebrow">YOUR FINANCIAL OVERVIEW</span><h1>Good to see you again</h1><p>Here’s what’s happening with your Credenza accounts today.</p></div><Button variant="outlined" startIcon={<RefreshCw size={16}/>} onClick={onRefresh} disabled={busy}>Refresh</Button></div>
    <section className="balance-hero"><div className="balance-orb orb-one"/><div className="balance-orb orb-two"/><div className="balance-hero-top"><span>CONSOLIDATED AVAILABLE BALANCE</span><span className="secure-label"><ShieldCheck size={14}/> Secure account</span></div><div className="balance-total">{money(total)}</div><div className="balance-hero-bottom"><span>{accounts.length} active account{accounts.length === 1 ? '' : 's'} · Held {money(held)}</span><span>{bank.id} · {bank.ifsc}</span></div><div className="hero-actions"><button onClick={() => go('transfer')}><Send size={16}/> Send money</button><button onClick={() => go('accounts')}><CreditCard size={16}/> View accounts</button></div></section>
    <div className="metric-grid"><div className="metric-card"><span className="metric-icon blue"><Wallet size={18}/></span><div><small>Active accounts</small><b>{accounts.length}</b></div></div><div className="metric-card"><span className="metric-icon green"><ArrowDownLeft size={18}/></span><div><small>Recent incoming</small><b>{rows.filter(r => r.direction === 'CREDIT').length}</b></div></div><div className="metric-card"><span className="metric-icon violet"><Activity size={18}/></span><div><small>Recent transfers</small><b>{(data.transfers || []).length}</b></div></div></div>
    <section className="surface section-surface"><div className="section-title-row"><div><span className="eyebrow">ACCOUNT ACTIVITY</span><h2>Recent transactions</h2></div><button className="text-link" onClick={() => go('activity')}>View all <ChevronRight size={16}/></button></div>
      {rows.length ? <TransactionsTable rows={rows} directory={directory}/> : <EmptyState icon={Activity} title="No transactions yet" detail="Your completed and pending transfers will appear here."/>}
    </section>
  </>;
}

function AccountsPage({ accounts }) {
  const total = accounts.reduce((sum, a) => sum + (a.availableMinor || 0), 0);
  return <><div className="welcome-row"><div><span className="eyebrow">BANKING</span><h1>My accounts</h1><p>Review your account balances and account status.</p></div></div>
    <div className="account-summary surface"><span className="summary-icon"><Wallet size={20}/></span><div><small>Total available balance</small><b>{money(total)}</b></div><span className="summary-count">{accounts.length} account{accounts.length === 1 ? '' : 's'}</span></div>
    <div className="account-grid">{accounts.map((account, index) => <article className={'account-tile ' + (index === 0 ? 'featured' : '')} key={account.accountId}><div className="tile-top"><span className="tile-bank-icon"><Landmark size={18}/></span><StatusChip status={account.status === 'ACTIVE' ? 'COMPLETED' : account.status}/></div><small>{account.label || 'Savings account'}</small><b className="tile-balance">{money(account.availableMinor)}</b><span className="account-number">{account.accountNumber}</span><div className="tile-bottom"><span>Held balance</span><b>{money(account.heldMinor)}</b></div></article>)}</div>
    {!accounts.length && <section className="surface"><EmptyState icon={Wallet} title="No accounts linked" detail="This signed-in Firebase user does not have an active synthetic account attached yet."/></section>}
  </>;
}

function DirectoryPage({ directory, bank }) {
  return <><div className="welcome-row"><div><span className="eyebrow">SHAREDBANK NETWORK</span><h1>Participating banks</h1><p>Bank entries returned by the shared directory.</p></div><span className="directory-count">{directory.length} entries</span></div>
    <section className="surface directory-surface"><div className="directory-current"><span className="bank-avatar"><Landmark size={21}/></span><div><b>{bank.name}</b><small>{bank.id} · {bank.ifsc} · Your bank</small></div><span className="network-active"><i/> Current bank</span></div>
      {directory.map(item => <div className="directory-row" key={item.bankId}><span className="bank-avatar muted"><Building2 size={18}/></span><div><b>{item.bankName || item.bankId}</b><small>{item.bankId} · {item.ifsc || 'IFSC unavailable'}</small></div><span className={'directory-status ' + (item.status === 'ACTIVE' ? 'active' : '')}>{item.status || 'Unknown'}</span></div>)}
      {!directory.length && <EmptyState icon={Building2} title="Directory unavailable" detail="The SharedBank directory did not return any bank records. Check the Worker connection."/>}
    </section>
  </>;
}

export default function LiveBank({ bank, switchUrl, openDemo }) {
  const urlKey = 'x42-cloudflare-worker-url';
  const [base, setBase] = useState(() => configuredEndpoint || readStorage(localStorage, urlKey, ''));
  const [session, setSession] = useState(null);
  const prefix = '/banks/' + bank.id;
  const [url, setUrl] = useState(base);
  const [editUrl, setEditUrl] = useState(!base);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [data, setData] = useState({ accounts: [], transfers: [] });
  const [directory, setDirectory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState('overview');
  const [mobileNav, setMobileNav] = useState(false);
  const activeToken = useRef(null);
  activeToken.current = session?.token;
  const pending = useRef(new Map());

  const refresh = useCallback(async signal => {
    if (!session) return;
    try {
      const value = await liveApi(base, prefix + '/dashboard', { token: session.token, signal });
      if (signal?.aborted || activeToken.current !== session.token) return;
      setData({ accounts: value.accounts || [], transfers: value.transfers || [] }); setLoaded(true); setError('');
    } catch (failure) {
      if (signal?.aborted || activeToken.current !== session.token) return;
      if (failure.status === 401) { setSession(null); setData({ accounts: [], transfers: [] }); setLoaded(false); }
      setError(failure.message);
    }
  }, [base, prefix, session]);

  useEffect(() => {
    if (!session) return undefined;
    const controller = new AbortController();
    const update = () => { if (document.visibilityState === 'visible') refresh(controller.signal); };
    refresh(controller.signal); const timer = setInterval(update, 20_000); document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); controller.abort(); document.removeEventListener('visibilitychange', update); };
  }, [session, refresh]);

  useEffect(() => {
    if (!base) return undefined;
    const controller = new AbortController();
    liveApi(base, '/directory/banks', { signal: controller.signal }).then(value => setDirectory(value.banks || []))
      .catch(failure => { if (!controller.signal.aborted && session) setError(failure.message); });
    return () => controller.abort();
  }, [base, session]);

  function logout() { setSession(null); setLoaded(false); setData({ accounts: [], transfers: [] }); setNote(''); setPage('overview'); }
  async function signIn(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { const value = await liveApi(base, prefix + '/sign-in', { data: { email: email.trim(), password } }); setSession(value); }
    catch (failure) { setError(failure.message); }
    finally { setPassword(''); setBusy(false); }
  }
  function connect(event) {
    event.preventDefault(); setError('');
    try { const endpoint = parseEndpoint(url); if (endpoint !== base) { logout(); setDirectory([]); }
      saveStorage(localStorage, urlKey, endpoint); setBase(endpoint); setEditUrl(false);
    } catch (failure) { setError(failure.message); }
  }
  async function send(transfer) {
    const raw = JSON.stringify([bank.id, base, session.uid, transfer]);
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));
    const hash = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const keyName = 'x42-pending-' + hash;
    const key = pending.current.get(keyName) || readStorage(sessionStorage, keyName, null) || crypto.randomUUID();
    pending.current.set(keyName, key); saveStorage(sessionStorage, keyName, key);
    const row = await liveApi(base, prefix + '/transfers', { token: session.token, data: transfer, key });
    pending.current.delete(keyName); saveStorage(sessionStorage, keyName, null);
    const verb = row.status === 'COMPLETED' ? 'Transfer completed' : row.status === 'REJECTED' ? 'Transfer rejected' : row.status === 'MANUAL_REVIEW' ? 'Transfer sent for manual review' : 'Transfer accepted for processing';
    setNote(verb + ' · ' + row.transferId); await refresh(); return row;
  }

  const pageTitle = navItems.find(item => item.id === page)?.label || 'Overview';
  const transferRows = useMemo(() => data.transfers || [], [data.transfers]);

  if (!session) return <div className="auth-shell"><div className="auth-decoration decor-a"/><div className="auth-decoration decor-b"/>
    <div className="auth-left"><Brand/><div className="auth-message"><span className="eyebrow light">BANKING, REIMAGINED</span><h1>Confidence in every transaction.</h1><p>A smarter way to manage your money, monitor your accounts and transfer securely across the SharedBank test network.</p><div className="auth-points"><span><ShieldCheck size={17}/> Secure sign-in</span><span><Globe2 size={17}/> Participating bank network</span><span><Activity size={17}/> Live test account activity</span></div></div><div className="auth-footer">© {new Date().getFullYear()} Credenza Bank · Demonstration environment</div></div>
    <div className="auth-right"><div className="auth-card"><div className="auth-card-top"><span className="auth-icon"><Landmark size={23}/></span><span className="test-tag"><i/> TEST NETWORK</span></div><span className="eyebrow">WELCOME TO CREDENZA</span><h2>Sign in to your account</h2><p className="auth-subtitle">Use the customer account created in your bank’s Firebase project.</p>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {editUrl && <form className="auth-form" onSubmit={connect}><TextField label="SharedBank Worker URL" fullWidth required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-worker.workers.dev"/><Button type="submit" variant="contained" fullWidth>Connect to SharedBank</Button></form>}
      {!editUrl && base && <form className="auth-form" onSubmit={signIn}><TextField label="Email address" type="email" autoComplete="username" required fullWidth value={email} onChange={e => setEmail(e.target.value)}/><TextField label="Password" type="password" autoComplete="current-password" required fullWidth value={password} onChange={e => setPassword(e.target.value)}/><Button type="submit" variant="contained" fullWidth size="large" disabled={busy}>{busy ? 'Authenticating…' : 'Sign in securely'}</Button><button type="button" className="subtle-action" onClick={() => { setUrl(base); setEditUrl(true); }}>Change Worker connection</button></form>}
      <div className="auth-security"><ShieldCheck size={15}/> Your credentials are sent to the configured SharedBank Worker over HTTPS.</div>
      {openDemo && <Button variant="text" onClick={openDemo} sx={{ mt: 1 }}>Open browser demo</Button>}
    </div></div></div>;

  return <div className="app-shell">
    <aside className={'app-sidebar ' + (mobileNav ? 'mobile-open' : '')}><div className="sidebar-top"><Brand compact/><button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={20}/></button></div>
      <div className="nav-caption">WORKSPACE</div><nav className="app-nav">{navItems.map(item => { const Icon = item.icon; return <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => { setPage(item.id); setMobileNav(false); }}><Icon size={18}/><span>{item.label}</span>{page === item.id && <span className="nav-active-mark"/>}</button>; })}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span><CircleHelp size={17}/></span><b>Need assistance?</b><p>Contact your bank administrator for account support.</p></div><div className="sidebar-network"><span className="network-dot"/><span>SharedBank connected</span><button title="Change Worker URL" onClick={() => { setUrl(base); setEditUrl(true); logout(); }}><Globe2 size={15}/></button></div><button className="signout-button" onClick={logout}><LogOut size={17}/> Sign out</button></div>
    </aside>
    {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
    <div className="app-main"><header className="app-topbar"><div className="topbar-left"><button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21}/></button><div><small>YOUR BANKING</small><b>{pageTitle}</b></div></div><div className="topbar-right"><span className="top-network"><i/> Test environment</span><Tooltip title="Refresh account data"><button className="icon-button" onClick={() => refresh()}><RefreshCw size={17}/></button></Tooltip><button className="icon-button notification-button" title="Notifications"><Bell size={17}/></button><Divider orientation="vertical" flexItem/><Avatar sx={{ width: 34, height: 34, bgcolor: '#e9efff', color: '#234ec5', fontSize: 13, fontWeight: 750 }}>{(session.email || 'C').slice(0,1).toUpperCase()}</Avatar><div className="profile-short"><b>{session.email}</b><small>Customer</small></div></div></header>
      <main className="page-content">
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
        {note && <Alert severity="success" onClose={() => setNote('')}>{note}</Alert>}
        {!loaded && <div className="loading-strip"><span/> Loading your account information securely…</div>}
        {loaded && page === 'overview' && <Overview bank={bank} data={data} directory={directory} go={setPage} onRefresh={() => refresh()} busy={busy}/>}
        {loaded && page === 'accounts' && <AccountsPage accounts={data.accounts || []}/>}
        {loaded && page === 'transfer' && <><div className="welcome-row"><div><span className="eyebrow">PAYMENTS & TRANSFERS</span><h1>Move money with confidence</h1><p>Send money to your own Credenza accounts or another active participating bank.</p></div></div><TransferForm bank={bank} accounts={data.accounts || []} directory={directory} send={send} onDone={row => { if (row.status === 'COMPLETED') setNote('Transfer completed · ' + row.transferId); else setNote('Transfer ' + (statusNames[row.status] || 'accepted') + ' · ' + row.transferId); setPage('activity'); }}/></>}
        {loaded && page === 'activity' && <><div className="welcome-row"><div><span className="eyebrow">ACCOUNT HISTORY</span><h1>Transaction history</h1><p>Latest transfer activity associated with your signed-in account.</p></div><Button variant="outlined" startIcon={<RefreshCw size={16}/>} onClick={() => refresh()}>Refresh</Button></div><section className="surface section-surface">{transferRows.length ? <TransactionsTable rows={transferRows} directory={directory}/> : <EmptyState icon={Activity} title="Nothing to show yet" detail="Once you make or receive a transfer, it will be listed here."/>}</section></>}
        {loaded && page === 'directory' && <DirectoryPage directory={directory} bank={bank}/>}
        <footer className="app-footer"><span>Credenza Bank · {bank.id}</span><span><ShieldCheck size={13}/> SharedBank synthetic test network</span><span>Balances are not real funds</span></footer>
      </main>
    </div>
  </div>;
}
