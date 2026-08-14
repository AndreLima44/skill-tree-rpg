// =========================================================
// BIBLIOTECA COMPARTILHADA DE DOCUMENTOS
// Mestre publica; cada usuario organiza sua propria visao.
// =========================================================

const DOCUMENTS_BUCKET = 'campaign-documents';
let documentsCache = [];
let documentStateCache = new Map();
let documentsRealtimeChannel = null;
let documentsLoading = false;
let documentFilters = { query:'', category:'all', folder:'all', favorites:false, unread:false, view:'grid' };

function normalizeDocText(value='') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function formatDocumentSize(bytes) {
  const size = Number(bytes || 0);
  if (!size) return '—';
  const units = ['B','KB','MB','GB'];
  const idx = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / Math.pow(1024, idx);
  return `${value >= 10 || idx === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[idx]}`;
}

function documentTypeLabel(mime='', fileName='') {
  const m = String(mime || '').toLowerCase();
  const name = String(fileName || '').toLowerCase();
  if (m.includes('pdf') || name.endsWith('.pdf')) return ['PDF','📕'];
  if (m.startsWith('image/')) return ['Imagem','🖼️'];
  if (m.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) return ['Documento','📘'];
  if (m.includes('sheet') || m.includes('excel') || name.endsWith('.xls') || name.endsWith('.xlsx')) return ['Planilha','📗'];
  if (m.includes('presentation') || m.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) return ['Apresentação','📙'];
  if (m.startsWith('text/')) return ['Texto','📄'];
  return ['Arquivo','📎'];
}

function getDocumentUserState(docId) {
  return documentStateCache.get(String(docId)) || { favorite:false, folder:'', personal_tags:[], read_at:null };
}

async function ensureDocumentsRealtime() {
  if (!currentUser?.id || documentsRealtimeChannel) return;
  documentsRealtimeChannel = supabaseClient.channel(`documents:${currentUser.id}`)
    .on('postgres_changes', { event:'*', schema:'public', table:'shared_documents' }, () => {
      if (currentTab === 'documentos') loadDocumentsPage({ silent:true });
    })
    .on('postgres_changes', { event:'*', schema:'public', table:'document_user_state', filter:`user_id=eq.${currentUser.id}` }, () => {
      if (currentTab === 'documentos') loadDocumentsPage({ silent:true });
    })
    .subscribe();
}

async function fetchDocumentsData() {
  const docsPromise = supabaseClient
    .from('shared_documents')
    .select('*')
    .order('pinned', { ascending:false })
    .order('created_at', { ascending:false });

  const statePromise = supabaseClient
    .from('document_user_state')
    .select('*')
    .eq('user_id', currentUser.id);

  const [docsRes, stateRes] = await Promise.all([docsPromise, statePromise]);
  if (docsRes.error) throw docsRes.error;
  if (stateRes.error) throw stateRes.error;

  documentsCache = Array.isArray(docsRes.data) ? docsRes.data : [];
  documentStateCache = new Map((stateRes.data || []).map(row => [String(row.document_id), row]));
}

function getDocumentCategories() {
  return [...new Set(documentsCache.map(d => String(d.category || '').trim()).filter(Boolean))]
    .sort((a,b) => a.localeCompare(b, 'pt-BR'));
}

function getPersonalFolders() {
  return [...new Set([...documentStateCache.values()].map(s => String(s.folder || '').trim()).filter(Boolean))]
    .sort((a,b) => a.localeCompare(b, 'pt-BR'));
}

function filteredDocuments() {
  const q = normalizeDocText(documentFilters.query);
  return documentsCache.filter(doc => {
    const state = getDocumentUserState(doc.id);
    if (documentFilters.category !== 'all' && String(doc.category || '') !== documentFilters.category) return false;
    if (documentFilters.folder !== 'all' && String(state.folder || '') !== documentFilters.folder) return false;
    if (documentFilters.favorites && !state.favorite) return false;
    if (documentFilters.unread && state.read_at) return false;
    if (!q) return true;
    const haystack = normalizeDocText([
      doc.title, doc.description, doc.category, doc.file_name,
      ...(Array.isArray(doc.tags) ? doc.tags : []),
      state.folder,
      ...(Array.isArray(state.personal_tags) ? state.personal_tags : [])
    ].filter(Boolean).join(' '));
    return q.split(/\s+/).filter(Boolean).every(token => haystack.includes(token));
  });
}

function renderDocumentsPage() {
  const main = document.getElementById('main-content');
  if (!main) return;
  const categories = getDocumentCategories();
  const folders = getPersonalFolders();
  const docs = filteredDocuments();

  main.innerHTML = `
    <section class="documents-shell">
      <header class="documents-hero">
        <div>
          <span class="section-eyebrow">ARQUIVO DA CAMPANHA</span>
          <h1>Documentos</h1>
          <p>Cartas, imagens, pistas, mapas e arquivos recebidos durante a campanha.</p>
        </div>
        ${currentRole === 'admin' ? `<button class="primary-action" onclick="openDocumentUploader()">+ Adicionar documento</button>` : ''}
      </header>

      <div class="documents-toolbar">
        <label class="documents-search">
          <span>⌕</span>
          <input id="documents-search-input" value="${escapeAttr(documentFilters.query)}" placeholder="Pesquisar documento, tag, categoria..." oninput="setDocumentSearch(this.value)">
        </label>
        <select onchange="setDocumentCategory(this.value)" aria-label="Categoria">
          <option value="all">Todas as categorias</option>
          ${categories.map(c => `<option value="${escapeAttr(c)}" ${documentFilters.category===c?'selected':''}>${escapeHtml(c)}</option>`).join('')}
        </select>
        <select onchange="setDocumentFolder(this.value)" aria-label="Pasta pessoal">
          <option value="all">Todas as minhas pastas</option>
          ${folders.map(f => `<option value="${escapeAttr(f)}" ${documentFilters.folder===f?'selected':''}>${escapeHtml(f)}</option>`).join('')}
        </select>
        <button class="documents-filter-btn ${documentFilters.favorites?'active':''}" onclick="toggleDocumentFavorites()">★ Favoritos</button>
        <button class="documents-filter-btn ${documentFilters.unread?'active':''}" onclick="toggleDocumentUnread()">● Não lidos</button>
      </div>

      <div class="documents-summary">
        <span>${docs.length} de ${documentsCache.length} documento(s)</span>
        <span>${documentsCache.filter(d => getDocumentUserState(d.id).favorite).length} favorito(s)</span>
        <span>${documentsCache.filter(d => !getDocumentUserState(d.id).read_at).length} não lido(s)</span>
      </div>

      ${currentRole === 'admin' ? renderDocumentUploadPanel() : ''}

      <div class="documents-grid">
        ${docs.length ? docs.map(renderDocumentCard).join('') : `
          <div class="documents-empty">
            <span>📂</span>
            <h3>Nenhum documento encontrado</h3>
            <p>${documentsCache.length ? 'Tente remover alguns filtros.' : 'O mestre ainda não adicionou documentos à campanha.'}</p>
          </div>`}
      </div>
    </section>
  `;
}

function renderDocumentCard(doc) {
  const state = getDocumentUserState(doc.id);
  const [typeLabel, icon] = documentTypeLabel(doc.mime_type, doc.file_name);
  const tags = Array.isArray(doc.tags) ? doc.tags : [];
  const personalTags = Array.isArray(state.personal_tags) ? state.personal_tags : [];
  return `
    <article class="document-card ${doc.pinned?'pinned':''} ${state.read_at?'':'unread'}" data-document-id="${escapeAttr(doc.id)}">
      <div class="document-card-top">
        <div class="document-type-icon">${icon}</div>
        <div class="document-title-wrap">
          <div class="document-kicker">${escapeHtml(doc.category || typeLabel)}${doc.pinned?' • FIXADO':''}</div>
          <h3>${escapeHtml(doc.title || doc.file_name || 'Documento')}</h3>
        </div>
        <button class="document-favorite ${state.favorite?'active':''}" onclick="toggleDocumentFavorite('${escapeAttr(doc.id)}')" title="Favorito">★</button>
      </div>
      ${doc.description ? `<p class="document-description">${escapeHtml(doc.description)}</p>` : ''}
      <div class="document-tags">
        ${tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}
        ${personalTags.map(t => `<span class="personal">#${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="document-meta">
        <span>${typeLabel}</span><span>${formatDocumentSize(doc.size_bytes)}</span><span>${new Date(doc.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
      ${state.folder ? `<div class="document-folder">📁 ${escapeHtml(state.folder)}</div>` : ''}
      <div class="document-actions">
        <button class="primary-action" onclick="openSharedDocument('${escapeAttr(doc.id)}')">Abrir</button>
        <button onclick="organizeSharedDocument('${escapeAttr(doc.id)}')">Organizar</button>
        ${currentRole === 'admin' ? `<button onclick="editSharedDocument('${escapeAttr(doc.id)}')">Editar</button><button class="danger-action" onclick="deleteSharedDocument('${escapeAttr(doc.id)}')">Excluir</button>` : ''}
      </div>
    </article>`;
}

function renderDocumentUploadPanel() {
  return `<section id="document-upload-panel" class="document-upload-panel hidden">
    <div class="document-upload-head"><div><span class="section-eyebrow">NOVO DOCUMENTO</span><h3>Publicar para todos</h3></div><button onclick="closeDocumentUploader()">✕</button></div>
    <div class="document-upload-grid">
      <label><span>Título</span><input id="doc-upload-title" placeholder="Ex.: Carta encontrada na torre"></label>
      <label><span>Categoria</span><input id="doc-upload-category" placeholder="Ex.: Pistas, Mapas, Cartas"></label>
      <label class="wide"><span>Descrição</span><textarea id="doc-upload-description" rows="2" placeholder="Contexto opcional do documento"></textarea></label>
      <label class="wide"><span>Tags compartilhadas</span><input id="doc-upload-tags" placeholder="Ex.: torre, culto, sessão 4"></label>
      <label class="wide file"><span>Arquivo</span><input id="doc-upload-file" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx"></label>
      <label class="document-pin"><input id="doc-upload-pinned" type="checkbox"> Fixar no topo</label>
    </div>
    <div class="document-upload-actions"><span id="doc-upload-status"></span><button onclick="closeDocumentUploader()">Cancelar</button><button class="primary-action" onclick="uploadSharedDocument()">Publicar documento</button></div>
  </section>`;
}

async function loadDocumentsPage({ silent=false }={}) {
  if (!currentUser?.id || documentsLoading) return;
  const main = document.getElementById('main-content');
  documentsLoading = true;
  if (!silent && main) main.innerHTML = `<section class="documents-shell"><div class="documents-loading">Carregando documentos...</div></section>`;
  try {
    await fetchDocumentsData();
    await ensureDocumentsRealtime();
    if (currentTab === 'documentos') renderDocumentsPage();
  } catch (error) {
    console.error('Documents:', error);
    if (currentTab === 'documentos' && main) {
      main.innerHTML = `<section class="documents-shell"><div class="documents-error"><strong>Não foi possível carregar os documentos.</strong><p>${escapeHtml(error.message || 'Erro desconhecido')}</p><p>Se esta é a primeira vez usando esta área, execute <code>supabase-migration-v4-documents.sql</code>.</p><button class="primary-action" onclick="loadDocumentsPage()">Tentar novamente</button></div></section>`;
    }
  } finally { documentsLoading = false; }
}

window.loadDocumentsPage = loadDocumentsPage;
window.setDocumentSearch = function(value){ documentFilters.query=value||''; renderDocumentsPage(); const el=document.getElementById('documents-search-input'); if(el){el.focus(); try{el.setSelectionRange(el.value.length,el.value.length)}catch(_){}} };
window.setDocumentCategory = function(value){ documentFilters.category=value||'all'; renderDocumentsPage(); };
window.setDocumentFolder = function(value){ documentFilters.folder=value||'all'; renderDocumentsPage(); };
window.toggleDocumentFavorites = function(){ documentFilters.favorites=!documentFilters.favorites; renderDocumentsPage(); };
window.toggleDocumentUnread = function(){ documentFilters.unread=!documentFilters.unread; renderDocumentsPage(); };

window.openDocumentUploader = function(){ document.getElementById('document-upload-panel')?.classList.remove('hidden'); document.getElementById('doc-upload-title')?.focus(); };
window.closeDocumentUploader = function(){ document.getElementById('document-upload-panel')?.classList.add('hidden'); };

window.uploadSharedDocument = async function() {
  if (currentRole !== 'admin') return;
  const file = document.getElementById('doc-upload-file')?.files?.[0];
  const status = document.getElementById('doc-upload-status');
  if (!file) { if(status) status.textContent='Escolha um arquivo.'; return; }
  if (file.size > 25 * 1024 * 1024) { if(status) status.textContent='Limite: 25 MB por arquivo.'; return; }
  const title = document.getElementById('doc-upload-title')?.value.trim() || file.name.replace(/\.[^.]+$/, '');
  const category = document.getElementById('doc-upload-category')?.value.trim() || 'Geral';
  const description = document.getElementById('doc-upload-description')?.value.trim() || '';
  const tags = (document.getElementById('doc-upload-tags')?.value || '').split(',').map(v=>v.trim()).filter(Boolean);
  const pinned = !!document.getElementById('doc-upload-pinned')?.checked;
  const ext = (file.name.split('.').pop() || 'bin').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
  const storagePath = `${new Date().getFullYear()}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  try {
    if(status) status.textContent='Enviando arquivo...';
    const upload = await supabaseClient.storage.from(DOCUMENTS_BUCKET).upload(storagePath, file, { cacheControl:'3600', upsert:false, contentType:file.type || undefined });
    if (upload.error) throw upload.error;
    const insert = await supabaseClient.from('shared_documents').insert({
      title, description, category, tags, pinned, storage_path:storagePath,
      file_name:file.name, mime_type:file.type || 'application/octet-stream', size_bytes:file.size, created_by:currentUser.id
    }).select().single();
    if (insert.error) { await supabaseClient.storage.from(DOCUMENTS_BUCKET).remove([storagePath]); throw insert.error; }
    if(status) status.textContent='Publicado.';
    closeDocumentUploader();
    await loadDocumentsPage({ silent:true });
  } catch(error) {
    console.error(error); if(status) status.textContent=error.message || 'Erro ao publicar.';
  }
};

window.openSharedDocument = async function(id) {
  const doc = documentsCache.find(d => String(d.id) === String(id));
  if (!doc) return;
  const state = getDocumentUserState(id);
  if (!state.read_at) await upsertDocumentState(id, { read_at:new Date().toISOString() }, false);
  const { data, error } = await supabaseClient.storage.from(DOCUMENTS_BUCKET).createSignedUrl(doc.storage_path, 300);
  if (error) { alert('Não foi possível abrir o documento.\n' + error.message); return; }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  if (currentTab === 'documentos') renderDocumentsPage();
};

async function upsertDocumentState(documentId, patch, rerender=true) {
  const previous = getDocumentUserState(documentId);
  const row = {
    document_id:documentId, user_id:currentUser.id,
    favorite:previous.favorite || false,
    folder:previous.folder || '',
    personal_tags:Array.isArray(previous.personal_tags)?previous.personal_tags:[],
    read_at:previous.read_at || null,
    ...patch,
    updated_at:new Date().toISOString()
  };
  const { data, error } = await supabaseClient.from('document_user_state').upsert(row, { onConflict:'document_id,user_id' }).select().single();
  if (error) { alert('Não foi possível organizar o documento.\n' + error.message); return false; }
  documentStateCache.set(String(documentId), data || row);
  if (rerender && currentTab === 'documentos') renderDocumentsPage();
  return true;
}

window.toggleDocumentFavorite = async function(id) {
  const state = getDocumentUserState(id);
  await upsertDocumentState(id, { favorite:!state.favorite });
};

window.organizeSharedDocument = async function(id) {
  const state = getDocumentUserState(id);
  const folder = prompt('Minha pasta para este documento:', state.folder || '');
  if (folder === null) return;
  const tagsRaw = prompt('Minhas tags pessoais, separadas por vírgula:', (state.personal_tags || []).join(', '));
  if (tagsRaw === null) return;
  const personal_tags = tagsRaw.split(',').map(v=>v.trim()).filter(Boolean);
  await upsertDocumentState(id, { folder:folder.trim(), personal_tags });
};

window.editSharedDocument = async function(id) {
  if (currentRole !== 'admin') return;
  const doc = documentsCache.find(d => String(d.id) === String(id));
  if (!doc) return;
  const title = prompt('Título:', doc.title || ''); if (title === null) return;
  const description = prompt('Descrição:', doc.description || ''); if (description === null) return;
  const category = prompt('Categoria:', doc.category || 'Geral'); if (category === null) return;
  const tagsRaw = prompt('Tags compartilhadas, separadas por vírgula:', (doc.tags || []).join(', ')); if (tagsRaw === null) return;
  const pinned = confirm('Fixar este documento no topo?\nOK = Sim / Cancelar = Não');
  const { error } = await supabaseClient.from('shared_documents').update({ title:title.trim()||doc.file_name, description:description.trim(), category:category.trim()||'Geral', tags:tagsRaw.split(',').map(v=>v.trim()).filter(Boolean), pinned, updated_at:new Date().toISOString() }).eq('id', id);
  if (error) alert(error.message); else await loadDocumentsPage({ silent:true });
};

window.deleteSharedDocument = async function(id) {
  if (currentRole !== 'admin') return;
  const doc = documentsCache.find(d => String(d.id) === String(id));
  if (!doc || !confirm(`Excluir “${doc.title || doc.file_name}” para todos?`)) return;
  const remove = await supabaseClient.storage.from(DOCUMENTS_BUCKET).remove([doc.storage_path]);
  if (remove.error) { alert('Não foi possível remover o arquivo.\n' + remove.error.message); return; }
  const del = await supabaseClient.from('shared_documents').delete().eq('id', id);
  if (del.error) alert(del.error.message); else await loadDocumentsPage({ silent:true });
};
