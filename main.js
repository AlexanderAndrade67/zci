// ========= ROTADOR DE FRASES (Hero) =========
  const HERO_PHRASES = [
    "Somos la pieza esencial para su inversión inmobiliaria.",
    "Confianza, transparencia y dedicación en cada proyecto.",
    "Protegemos y aumentamos el valor de su patrimonio.",
    "Administración experta de arriendos y activos inmobiliarios."
  ];
  (function rotateHeroPhrase(){
    const el = document.getElementById('hero-rotator');
    if(!el || HERO_PHRASES.length < 2) return;
    let i = 0;
    const DURATION = 3500, FADE = 400;
    setInterval(()=>{
      el.classList.remove('show');         // fade out
      setTimeout(()=>{
        i = (i + 1) % HERO_PHRASES.length;
        el.textContent = HERO_PHRASES[i];  // nuevo texto
        el.classList.add('show');          // fade in
      }, FADE);
    }, DURATION);
  })();

  // ========= CONFIG: Noticias (actualización automática) =========
  const NEWS_FALLBACK_ITEMS = [
    {
      title: "Panorama de vivienda y arriendos en Colombia 2026",
      source: "Sector inmobiliario",
      url: "https://www.minvivienda.gov.co/",
      date: "2026-01-15",
      tags: ["Vivienda", "Arriendos", "Colombia"]
    },
    {
      title: "Indicadores para compra y venta de inmuebles en 2026",
      source: "Mercado inmobiliario",
      url: "https://www.fincaraiz.com.co/",
      date: "2026-01-10",
      tags: ["Venta", "Mercado", "Inversión"]
    },
    {
      title: "Actualizaciones en propiedad horizontal y administración",
      source: "Normativa",
      url: "https://www.supernotariado.gov.co/",
      date: "2026-01-05",
      tags: ["Propiedad Horizontal", "Normatividad"]
    }
  ];
  const NEWS_RSS_SOURCES = [
    { source: "Google News", url: "https://news.google.com/rss/search?q=inmobiliario+colombia&hl=es-419&gl=CO&ceid=CO:es-419" },
    { source: "Google News", url: "https://news.google.com/rss/search?q=arriendos+medellin&hl=es-419&gl=CO&ceid=CO:es-419" },
    { source: "Google News", url: "https://news.google.com/rss/search?q=propiedad+horizontal+colombia&hl=es-419&gl=CO&ceid=CO:es-419" }
  ];

  // ========= Supabase: login para subida de fotos =========
  const SUPABASE_URL = "https://jtnlcckphveeqhyrxlku.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_khOBBj9EIe2Ahmkz_KxVUw_R-SDOpk0";
  const SUPABASE_BUCKET = "inmuebles-fotos";
  const SUPABASE_FORMS_BUCKET = "formularios-zci";
  const FALLBACK_PROPERTY_IMG = "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80";
  const supabaseClient = window.supabase?.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const inmueblesListEl = document.getElementById('inmuebles-lista');
  const defaultInmueblesMarkup = inmueblesListEl?.innerHTML || '';
  const propertyDetailContentEl = document.getElementById('property-detail-content');
  const modalDetalleInmuebleEl = document.getElementById('modalDetalleInmueble');
  const modalDetalleInmuebleTitleEl = document.getElementById('modalDetalleInmuebleLabel');
  const inmueblesCacheById = new Map();
  let modalDetalleInmuebleInstance = null;

  function escapeHtml(value){
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatCOP(value){
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numberValue);
  }

  function getPrimaryPhotoUrl(fotos){
    if (!Array.isArray(fotos) || !fotos.length) return FALLBACK_PROPERTY_IMG;
    const mainPhoto = fotos.find((f) => f?.es_principal && f?.url_publica);
    return mainPhoto?.url_publica || fotos.find((f) => f?.url_publica)?.url_publica || FALLBACK_PROPERTY_IMG;
  }

  function normalizeFotos(fotos){
    return (Array.isArray(fotos) ? fotos : [])
      .filter((f) => f?.url_publica)
      .sort((a, b) => {
        if (a.es_principal === b.es_principal){
          return String(a.created_at || '').localeCompare(String(b.created_at || ''));
        }
        return a.es_principal ? -1 : 1;
      });
  }

  function renderPropertyDetailModal(inmuebleId){
    const inmueble = inmueblesCacheById.get(inmuebleId);
    if (!inmueble || !propertyDetailContentEl || !modalDetalleInmuebleEl) return;

    const fotos = normalizeFotos(inmueble.inmueble_fotos);
    const title = escapeHtml(inmueble.titulo || 'Inmueble');
    const code = escapeHtml(inmueble.codigo || 'Sin código');
    const negocio = inmueble.tipo_negocio === 'arriendo' ? 'Arriendo' : 'Venta';
    const type = escapeHtml(inmueble.tipo_inmueble || 'No especificado');
    const zone = escapeHtml([inmueble.zona, inmueble.ciudad].filter(Boolean).join(', ') || 'Ubicación no registrada');
    const areaText = inmueble.area_m2 ? `${Number(inmueble.area_m2)} m²` : 'No especificado';
    const habText = Number.isFinite(Number(inmueble.habitaciones)) ? `${inmueble.habitaciones} hab` : 'No especificado';
    const banosText = Number.isFinite(Number(inmueble.banos)) ? `${inmueble.banos} baños` : 'No especificado';
    const priceText = `${formatCOP(inmueble.precio)}${inmueble.tipo_negocio === 'arriendo' ? ' / mes' : ''}`;
    const descripcion = escapeHtml(inmueble.descripcion || 'Sin descripción adicional.');
    const carouselId = `property-detail-carousel-${inmuebleId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

    const carouselItems = (fotos.length ? fotos : [{ url_publica: FALLBACK_PROPERTY_IMG }]).map((foto, idx) => `
      <div class="carousel-item ${idx === 0 ? 'active' : ''}">
        <img src="${escapeHtml(foto.url_publica)}" alt="${title} - Foto ${idx + 1}">
      </div>
    `).join('');

    const carouselControls = fotos.length > 1 ? `
      <button class="carousel-control-prev" type="button" data-bs-target="#${carouselId}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Anterior</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${carouselId}" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Siguiente</span>
      </button>
    ` : '';

    propertyDetailContentEl.innerHTML = `
      <div class="row g-4">
        <div class="col-lg-7">
          <div id="${carouselId}" class="carousel slide property-detail-carousel" data-bs-ride="false">
            <div class="carousel-inner">${carouselItems}</div>
            ${carouselControls}
          </div>
          <div class="small text-muted mt-2">${fotos.length || 1} foto(s) disponible(s)</div>
        </div>
        <div class="col-lg-5">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
            <span class="badge text-bg-dark">${negocio}</span>
            <span class="text-muted small">Cod. ${code}</span>
          </div>
          <h4 class="mb-1">${title}</h4>
          <p class="text-muted mb-3"><i class="fa-solid fa-location-dot me-1"></i>${zone}</p>
          <div class="detail-meta-grid mb-3">
            <span><i class="fa-solid fa-house me-1"></i>${type}</span>
            <span><i class="fa-solid fa-ruler-combined me-1"></i>${escapeHtml(areaText)}</span>
            <span><i class="fa-solid fa-bed me-1"></i>${escapeHtml(habText)}</span>
            <span><i class="fa-solid fa-bath me-1"></i>${escapeHtml(banosText)}</span>
          </div>
          <div class="h4 fw-bold mb-3" style="color: var(--brand);">${escapeHtml(priceText)}</div>
          <h6 class="mb-1">Descripción</h6>
          <p class="mb-0 text-muted">${descripcion}</p>
        </div>
      </div>
    `;

    modalDetalleInmuebleTitleEl && (modalDetalleInmuebleTitleEl.textContent = inmueble.titulo || 'Detalle de inmueble');
    if (!modalDetalleInmuebleInstance){
      modalDetalleInmuebleInstance = bootstrap.Modal.getOrCreateInstance(modalDetalleInmuebleEl);
    }
    modalDetalleInmuebleInstance.show();
  }

  async function loadInmueblesFromSupabase(){
    if (!inmueblesListEl || !supabaseClient) return;

    const { data, error } = await supabaseClient
      .from('inmuebles')
      .select(`
        id,
        codigo,
        titulo,
        tipo_negocio,
        tipo_inmueble,
        ciudad,
        zona,
        area_m2,
        habitaciones,
        banos,
        precio,
        descripcion,
        created_at,
        inmueble_fotos(url_publica, es_principal, created_at)
      `)
      .eq('activo', true)
      .order('created_at', { ascending: false })
      .limit(9);

    if (error){
      if (!inmueblesListEl.innerHTML.trim()) inmueblesListEl.innerHTML = defaultInmueblesMarkup;
      return;
    }

    if (!data?.length){
      inmueblesListEl.innerHTML = defaultInmueblesMarkup;
      return;
    }

    inmueblesCacheById.clear();
    data.forEach((item) => inmueblesCacheById.set(item.id, item));
    inmueblesListEl.innerHTML = data.map((inmueble) => {
      const isRent = inmueble.tipo_negocio === 'arriendo';
      const badgeLabel = isRent ? 'ARRIENDO' : 'VENTA';
      const badgeClass = isRent ? 'rent' : 'sale';
      const priceSuffix = isRent ? ' / mes' : '';
      const zone = [inmueble.zona, inmueble.ciudad].filter(Boolean).join(', ') || 'Ubicación no registrada';
      const areaText = inmueble.area_m2 ? `${Number(inmueble.area_m2)} m²` : 'N/D';
      const habText = Number.isFinite(Number(inmueble.habitaciones)) ? `${inmueble.habitaciones} hab` : 'N/D';
      const banosText = Number.isFinite(Number(inmueble.banos)) ? `${inmueble.banos} baños` : 'N/D';
      const photoUrl = getPrimaryPhotoUrl(inmueble.inmueble_fotos);
      const totalPhotos = normalizeFotos(inmueble.inmueble_fotos).length || 1;
      const code = escapeHtml(inmueble.codigo || 'Sin código');
      const title = escapeHtml(inmueble.titulo || 'Inmueble');

      return `
        <div class="col-md-6 col-lg-4">
          <article class="property-card">
            <img class="property-thumb" src="${escapeHtml(photoUrl)}" alt="${title}">
            <div class="property-body">
              <div class="property-head">
                <span class="property-type ${badgeClass}">${badgeLabel}</span>
                <span class="property-code">Cod. ${code}</span>
              </div>
              <h3 class="property-title">${title}</h3>
              <p class="property-zone"><i class="fa-solid fa-location-dot me-1"></i>${escapeHtml(zone)}</p>
              <div class="property-meta">
                <span>${escapeHtml(areaText)}</span>
                <span>${escapeHtml(habText)}</span>
                <span>${escapeHtml(banosText)}</span>
              </div>
              <div class="property-price">${escapeHtml(formatCOP(inmueble.precio))}${priceSuffix}</div>
              <div class="small text-muted mb-2">${totalPhotos} foto(s)</div>
              <div class="property-actions">
                <button type="button" class="btn-property btn-ghost js-ver-detalle-inmueble" data-inmueble-id="${escapeHtml(inmueble.id)}">
                  Ver detalle completo
                </button>
                <a href="#contacto" class="btn-property">Solicitar Información</a>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join('');
  }

  inmueblesListEl?.addEventListener('click', (event) => {
    const button = event.target.closest('.js-ver-detalle-inmueble');
    if (!button) return;
    const inmuebleId = button.getAttribute('data-inmueble-id');
    if (!inmuebleId) return;
    renderPropertyDetailModal(inmuebleId);
  });

  (function setupSupabaseForms(){
    const modalEl = document.getElementById('modalFormularios');
    if (!modalEl) return;

    const statusEl = document.getElementById('forms-status-alert');
    const formsListEl = document.getElementById('forms-list');
    const authPanel = document.getElementById('forms-auth-panel');
    const uploadPanel = document.getElementById('forms-upload-panel');
    const loginForm = document.getElementById('forms-login-form');
    const uploadForm = document.getElementById('forms-upload-form');
    const logoutBtn = document.getElementById('forms-logout-btn');
    const userEmailEl = document.getElementById('forms-user-email');
    const fileNameInput = document.getElementById('forms-file-name');
    const fileInput = document.getElementById('forms-file-input');

    function setFormsStatus(message, level){
      if (!statusEl) return;
      statusEl.className = `alert alert-${level || 'info'} mb-0`;
      statusEl.textContent = message;
    }

    function sanitizeFilePart(value){
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '');
    }

    function extensionFromName(name){
      const ext = String(name || '').split('.').pop();
      return ext && ext !== name ? ext.toLowerCase() : 'pdf';
    }

    function prettyFormName(fileName){
      const base = String(fileName || '')
        .replace(/^\d+-/, '')
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim();
      return base ? base.replace(/\b([a-záéíóúñ])/g, (m) => m.toUpperCase()) : 'Formulario';
    }

    function formatFormDate(isoDate){
      if (!isoDate) return '';
      const d = new Date(isoDate);
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('es-CO', { year:'numeric', month:'short', day:'2-digit' });
    }

    function setFormsAuthPanels(session){
      const hasSession = Boolean(session?.user);
      authPanel?.classList.toggle('d-none', hasSession);
      uploadPanel?.classList.toggle('d-none', !hasSession);
      userEmailEl && (userEmailEl.textContent = hasSession ? (session.user.email || 'usuario autenticado') : '');
    }

    async function refreshFormsSession(){
      if (!supabaseClient){
        setFormsStatus('No se pudo cargar Supabase.', 'danger');
        return null;
      }
      const { data, error } = await supabaseClient.auth.getSession();
      if (error){
        setFormsStatus(`Error verificando sesión: ${error.message}`, 'danger');
        return null;
      }
      setFormsAuthPanels(data.session);
      return data.session;
    }

    async function loadFormsList(){
      if (!supabaseClient || !formsListEl) return;
      setFormsStatus('Cargando formularios...', 'info');
      const { data, error } = await supabaseClient.storage
        .from(SUPABASE_FORMS_BUCKET)
        .list('formularios', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } });

      if (error){
        setFormsStatus(`No se pudo leer el bucket "${SUPABASE_FORMS_BUCKET}": ${error.message}`, 'warning');
        formsListEl.innerHTML = '<li class="list-group-item text-muted">Aún no hay formularios disponibles.</li>';
        return;
      }

      const files = (Array.isArray(data) ? data : []).filter((item) => item?.name);
      if (!files.length){
        setFormsStatus('No hay formularios cargados todavía.', 'secondary');
        formsListEl.innerHTML = '<li class="list-group-item text-muted">Aún no hay formularios disponibles.</li>';
        return;
      }

      formsListEl.innerHTML = files.map((file) => {
        const path = `formularios/${file.name}`;
        const { data: urlData } = supabaseClient.storage.from(SUPABASE_FORMS_BUCKET).getPublicUrl(path);
        const publicUrl = urlData?.publicUrl || '#';
        const displayName = escapeHtml(prettyFormName(file.name));
        const fileDate = formatFormDate(file.created_at);
        const ext = escapeHtml(extensionFromName(file.name).toUpperCase());
        return `
          <li class="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div class="fw-semibold">${displayName}</div>
              <small class="text-muted">${ext}${fileDate ? ` · ${fileDate}` : ''}</small>
            </div>
            <a class="btn btn-sm btn-primary" href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener" download>
              <i class="fa-solid fa-download me-1"></i>Descargar
            </a>
          </li>
        `;
      }).join('');

      setFormsStatus(`Se encontraron ${files.length} formulario(s).`, 'success');
    }

    modalEl.addEventListener('show.bs.modal', async () => {
      await refreshFormsSession();
      await loadFormsList();
    });

    loginForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!supabaseClient) return;
      if (!loginForm.checkValidity()){
        loginForm.classList.add('was-validated');
        return;
      }
      setFormsStatus('Iniciando sesión...', 'info');
      const email = document.getElementById('forms-email')?.value.trim() || '';
      const password = document.getElementById('forms-password')?.value || '';
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error){
        setFormsStatus(`No fue posible iniciar sesión: ${error.message}`, 'danger');
        return;
      }
      loginForm.reset();
      loginForm.classList.remove('was-validated');
      await refreshFormsSession();
      setFormsStatus('Sesión iniciada. Ya puedes subir formularios.', 'success');
    });

    logoutBtn?.addEventListener('click', async () => {
      if (!supabaseClient) return;
      const { error } = await supabaseClient.auth.signOut();
      if (error){
        setFormsStatus(`No fue posible cerrar sesión: ${error.message}`, 'danger');
        return;
      }
      await refreshFormsSession();
      setFormsStatus('Sesión cerrada.', 'secondary');
    });

    uploadForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!supabaseClient) return;
      if (!uploadForm.checkValidity()){
        uploadForm.classList.add('was-validated');
        return;
      }
      const session = await refreshFormsSession();
      if (!session?.user){
        setFormsStatus('Debes iniciar sesión para subir formularios.', 'warning');
        return;
      }
      const displayName = String(fileNameInput?.value || '').trim();
      const file = fileInput?.files?.[0];
      if (!displayName || !file){
        setFormsStatus('Ingresa nombre y selecciona archivo.', 'warning');
        return;
      }

      const cleanName = sanitizeFilePart(displayName) || 'formulario';
      const ext = extensionFromName(file.name);
      const path = `formularios/${Date.now()}-${cleanName}.${ext}`;

      setFormsStatus('Subiendo formulario...', 'info');
      const { error } = await supabaseClient.storage
        .from(SUPABASE_FORMS_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });

      if (error){
        setFormsStatus(`No se pudo subir el formulario: ${error.message}`, 'danger');
        return;
      }

      setFormsStatus('Formulario subido correctamente.', 'success');
      uploadForm.reset();
      uploadForm.classList.remove('was-validated');
      await loadFormsList();
    });

    supabaseClient?.auth.onAuthStateChange((_event, session) => {
      setFormsAuthPanels(session);
    });
  })();

  (function setupSupabaseUpload(){
    const modalEl = document.getElementById('modalSubirFotosInmueble');
    if (!modalEl) return;
    const PROPERTY_FORM_HISTORY_KEY = 'zci_property_form_history_v1';

    const statusEl = document.getElementById('supabase-upload-status');
    const authPanel = document.getElementById('supabase-auth-panel');
    const uploaderPanel = document.getElementById('supabase-uploader-panel');
    const loginForm = document.getElementById('supabase-login-form');
    const uploadForm = document.getElementById('supabase-upload-form');
    const userEmailEl = document.getElementById('supabase-user-email');
    const logoutBtn = document.getElementById('supabase-logout-btn');
    const fillLastBtn = document.getElementById('supabase-fill-last-btn');
    const suggestTitleBtn = document.getElementById('supabase-suggest-title-btn');
    const typeInput = document.getElementById('supabase-property-type');
    const cityInput = document.getElementById('supabase-property-city');
    const zoneInput = document.getElementById('supabase-property-zone');
    const titleInput = document.getElementById('supabase-property-title');
    const businessInput = document.getElementById('supabase-property-business');
    const areaInput = document.getElementById('supabase-property-area');
    const bedroomsInput = document.getElementById('supabase-property-bedrooms');
    const bathroomsInput = document.getElementById('supabase-property-bathrooms');
    const priceInput = document.getElementById('supabase-property-price');
    const descriptionInput = document.getElementById('supabase-property-description');
    const pricePreview = document.getElementById('supabase-price-preview');
    const codeInput = document.getElementById('supabase-property-code');
    const codeHint = document.getElementById('supabase-code-hint');

    function normalizeHistory(data){
      const base = { types: [], cities: [], zones: [], titles: [], lastForm: null };
      if (!data || typeof data !== 'object') return base;
      return {
        types: Array.isArray(data.types) ? data.types : [],
        cities: Array.isArray(data.cities) ? data.cities : [],
        zones: Array.isArray(data.zones) ? data.zones : [],
        titles: Array.isArray(data.titles) ? data.titles : [],
        lastForm: data.lastForm && typeof data.lastForm === 'object' ? data.lastForm : null
      };
    }

    function getFormHistory(){
      try{
        return normalizeHistory(JSON.parse(localStorage.getItem(PROPERTY_FORM_HISTORY_KEY) || '{}'));
      } catch (_err){
        return normalizeHistory(null);
      }
    }

    function saveFormHistory(history){
      try{
        localStorage.setItem(PROPERTY_FORM_HISTORY_KEY, JSON.stringify(normalizeHistory(history)));
      } catch (_err){
        // ignore localStorage errors
      }
    }

    function appendUnique(items, value, max = 20){
      const clean = String(value || '').trim();
      if (!clean) return items;
      const lower = clean.toLowerCase();
      const without = (Array.isArray(items) ? items : []).filter((item) => String(item).trim().toLowerCase() !== lower);
      return [clean, ...without].slice(0, max);
    }

    function syncDatalist(datalistId, values){
      const datalist = document.getElementById(datalistId);
      if (!datalist) return;
      const existingValues = Array.from(datalist.querySelectorAll('option')).map((o) => o.value);
      const merged = Array.from(new Set([...existingValues, ...(Array.isArray(values) ? values : [])])).filter(Boolean).slice(0, 30);
      datalist.innerHTML = merged.map((value) => `<option value="${escapeHtml(value)}"></option>`).join('');
    }

    function capitalizeWords(text){
      return String(text || '')
        .toLowerCase()
        .replace(/\b([a-záéíóúñ])/g, (m) => m.toUpperCase());
    }

    function buildSuggestedTitle(){
      const tipo = capitalizeWords(typeInput?.value || '').trim();
      const zona = capitalizeWords(zoneInput?.value || '').trim();
      const ciudad = capitalizeWords(cityInput?.value || '').trim();
      const negocio = businessInput?.value === 'arriendo' ? 'en Arriendo' : (businessInput?.value === 'venta' ? 'en Venta' : '');
      const lugar = zona || ciudad;
      if (tipo && lugar && negocio) return `${tipo} ${negocio} en ${lugar}`;
      if (tipo && lugar) return `${tipo} en ${lugar}`;
      if (tipo && negocio) return `${tipo} ${negocio}`;
      return '';
    }

    function updatePricePreview(){
      if (!pricePreview) return;
      const value = Number(priceInput?.value || 0);
      const formatted = Number.isFinite(value) && value > 0 ? formatCOP(value) : '$0';
      pricePreview.textContent = `Formato: ${formatted}`;
    }

    function applyHistorySuggestions(){
      const history = getFormHistory();
      syncDatalist('property-type-suggestions', history.types);
      syncDatalist('property-city-suggestions', history.cities);
      syncDatalist('property-zone-suggestions', history.zones);
    }

    function extractNumericCode(code){
      const digits = String(code || '').replace(/\D+/g, '');
      return digits ? Number(digits) : null;
    }

    async function getNextConsecutiveCode(){
      if (!supabaseClient) return null;
      const { data, error } = await supabaseClient
        .from('inmuebles')
        .select('codigo')
        .order('created_at', { ascending: false })
        .limit(300);
      if (error || !Array.isArray(data)) return null;
      const maxFound = data.reduce((max, row) => {
        const n = extractNumericCode(row?.codigo);
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
      return String((maxFound || 0) + 1);
    }

    async function suggestNextConsecutiveCode(force = false){
      if (!codeInput) return;
      const hasManualValue = codeInput.value.trim().length > 0;
      if (hasManualValue && !force) return;
      const nextCode = await getNextConsecutiveCode();
      if (!nextCode) return;
      codeInput.value = nextCode;
      codeHint && (codeHint.textContent = `Consecutivo sugerido: ${nextCode}`);
    }

    function fillFromLastForm(){
      const history = getFormHistory();
      const last = history.lastForm;
      if (!last){
        setStatus('Aún no hay datos previos para autollenar.', 'warning');
        return;
      }
      titleInput && (titleInput.value = last.titulo || '');
      businessInput && (businessInput.value = last.tipo_negocio || '');
      typeInput && (typeInput.value = last.tipo_inmueble || '');
      cityInput && (cityInput.value = last.ciudad || '');
      zoneInput && (zoneInput.value = last.zona || '');
      areaInput && (areaInput.value = last.area_m2 || '');
      bedroomsInput && (bedroomsInput.value = last.habitaciones || '');
      bathroomsInput && (bathroomsInput.value = last.banos || '');
      priceInput && (priceInput.value = last.precio || '');
      descriptionInput && (descriptionInput.value = last.descripcion || '');
      updatePricePreview();
      setStatus('Formulario autollenado con el último inmueble.', 'info');
    }

    fillLastBtn?.addEventListener('click', fillFromLastForm);
    suggestTitleBtn?.addEventListener('click', () => {
      const suggestion = buildSuggestedTitle();
      if (!suggestion){
        setStatus('Completa tipo, ciudad o zona para sugerir el título.', 'warning');
        return;
      }
      if (titleInput) titleInput.value = suggestion;
      setStatus('Título sugerido aplicado.', 'info');
    });
    [typeInput, cityInput, zoneInput, businessInput].forEach((input) => {
      input?.addEventListener('input', () => {
        if (!titleInput?.value.trim()) {
          const suggestion = buildSuggestedTitle();
          if (suggestion && titleInput) titleInput.placeholder = suggestion;
        }
      });
    });
    priceInput?.addEventListener('input', updatePricePreview);
    codeInput?.addEventListener('focus', () => {
      suggestNextConsecutiveCode(false);
    });
    applyHistorySuggestions();
    updatePricePreview();

    function setStatus(message, level){
      if (!statusEl) return;
      statusEl.className = `alert alert-${level || 'info'} mb-3`;
      statusEl.textContent = message;
    }

    function sanitizePathPart(value){
      return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9_-]/g, '');
    }

    function setPanels(session){
      const hasSession = Boolean(session?.user);
      authPanel?.classList.toggle('d-none', hasSession);
      uploaderPanel?.classList.toggle('d-none', !hasSession);

      if (hasSession){
        userEmailEl.textContent = session.user.email || 'usuario autenticado';
        setStatus('Sesión activa. Ya puedes subir fotos del inmueble.', 'success');
      } else {
        userEmailEl.textContent = '';
        setStatus('Para subir fotos debes iniciar sesión.', 'warning');
      }
    }

    async function refreshSession(){
      if (!supabaseClient){
        setStatus('No se pudo cargar Supabase. Revisa la conexión del sitio.', 'danger');
        return null;
      }
      const { data, error } = await supabaseClient.auth.getSession();
      if (error){
        setStatus(`Error verificando sesión: ${error.message}`, 'danger');
        return null;
      }
      setPanels(data.session);
      applyHistorySuggestions();
      if (data.session?.user) await suggestNextConsecutiveCode(false);
      return data.session;
    }

    modalEl.addEventListener('show.bs.modal', refreshSession);

    loginForm?.addEventListener('submit', async (event)=>{
      event.preventDefault();
      if (!supabaseClient) return;
      if (!loginForm.checkValidity()){
        loginForm.classList.add('was-validated');
        return;
      }

      setStatus('Iniciando sesión...', 'info');
      const email = document.getElementById('supabase-email')?.value.trim() || '';
      const password = document.getElementById('supabase-password')?.value || '';
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error){
        setStatus(`No fue posible iniciar sesión: ${error.message}`, 'danger');
        return;
      }

      loginForm.reset();
      loginForm.classList.remove('was-validated');
      await refreshSession();
    });

    logoutBtn?.addEventListener('click', async ()=>{
      if (!supabaseClient) return;
      const { error } = await supabaseClient.auth.signOut();
      if (error){
        setStatus(`No fue posible cerrar sesión: ${error.message}`, 'danger');
        return;
      }
      await refreshSession();
    });

    uploadForm?.addEventListener('submit', async (event)=>{
      event.preventDefault();
      if (!supabaseClient) return;
      if (!uploadForm.checkValidity()){
        uploadForm.classList.add('was-validated');
        return;
      }

      const session = await refreshSession();
      if (!session?.user) return;

      const propertyCodeRaw = document.getElementById('supabase-property-code')?.value || '';
      const propertyCode = sanitizePathPart(propertyCodeRaw);
      const propertyCodeLabel = String(propertyCodeRaw || '').trim().toUpperCase();
      const propertyTitle = document.getElementById('supabase-property-title')?.value.trim() || '';
      const propertyBusiness = document.getElementById('supabase-property-business')?.value || '';
      const propertyType = document.getElementById('supabase-property-type')?.value.trim() || '';
      const propertyCity = document.getElementById('supabase-property-city')?.value.trim() || '';
      const propertyZone = document.getElementById('supabase-property-zone')?.value.trim() || null;
      const propertyArea = document.getElementById('supabase-property-area')?.value;
      const propertyBedrooms = document.getElementById('supabase-property-bedrooms')?.value;
      const propertyBathrooms = document.getElementById('supabase-property-bathrooms')?.value;
      const propertyPrice = document.getElementById('supabase-property-price')?.value;
      const propertyDescription = document.getElementById('supabase-property-description')?.value.trim() || null;
      const files = Array.from(document.getElementById('supabase-photo-files')?.files || []);
      if (!propertyCode){
        setStatus('Ingresa un código de inmueble válido.', 'warning');
        return;
      }
      if (!propertyCodeLabel || !propertyTitle || !propertyBusiness || !propertyType || !propertyCity || !propertyPrice){
        setStatus('Completa los datos obligatorios del inmueble.', 'warning');
        return;
      }
      if (!files.length){
        setStatus('Selecciona al menos una imagen para subir.', 'warning');
        return;
      }

      setStatus('Guardando datos del inmueble...', 'info');
      const { data: inmuebleRow, error: inmuebleError } = await supabaseClient
        .from('inmuebles')
        .insert({
          codigo: propertyCodeLabel,
          titulo: propertyTitle,
          tipo_negocio: propertyBusiness,
          tipo_inmueble: propertyType,
          ciudad: propertyCity,
          zona: propertyZone,
          area_m2: propertyArea ? Number(propertyArea) : null,
          habitaciones: propertyBedrooms ? Number(propertyBedrooms) : null,
          banos: propertyBathrooms ? Number(propertyBathrooms) : null,
          precio: Number(propertyPrice),
          descripcion: propertyDescription,
          created_by: session.user.id
        })
        .select('id, codigo')
        .single();

      if (inmuebleError){
        if ((inmuebleError.message || '').toLowerCase().includes('duplicate key value')){
          await suggestNextConsecutiveCode(true);
          setStatus('El código ya existe. Asigné el siguiente consecutivo, revisa y vuelve a guardar.', 'warning');
          return;
        }
        setStatus(`No se pudo guardar el inmueble: ${inmuebleError.message}`, 'danger');
        return;
      }

      setStatus(`Subiendo ${files.length} archivo(s)...`, 'info');
      const uploadedUrls = [];
      const fotoRows = [];
      const baseTimestamp = Date.now();

      for (const [idx, file] of files.entries()){
        const cleanFileName = sanitizePathPart(file.name.replace(/\.[^/.]+$/, '')) || 'foto';
        const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const path = `inmuebles/${propertyCode}/${session.user.id}/${baseTimestamp}-${idx + 1}-${cleanFileName}.${extension}`;

        const { error } = await supabaseClient.storage
          .from(SUPABASE_BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type || 'image/jpeg' });

        if (error){
          setStatus(`Error subiendo "${file.name}": ${error.message}`, 'danger');
          return;
        }

        const { data } = supabaseClient.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
        if (data?.publicUrl){
          uploadedUrls.push(data.publicUrl);
          fotoRows.push({
            inmueble_id: inmuebleRow.id,
            storage_path: path,
            url_publica: data.publicUrl,
            es_principal: idx === 0,
            created_by: session.user.id
          });
        }
      }

      if (fotoRows.length){
        const { error: fotosError } = await supabaseClient.from('inmueble_fotos').insert(fotoRows);
        if (fotosError){
          setStatus(`Fotos subidas, pero no se pudieron registrar en la base de datos: ${fotosError.message}`, 'warning');
          return;
        }
      }

      setStatus(`Inmueble ${inmuebleRow.codigo} creado con ${uploadedUrls.length} imagen(es).`, 'success');
      const history = getFormHistory();
      history.types = appendUnique(history.types, propertyType);
      history.cities = appendUnique(history.cities, propertyCity);
      history.zones = appendUnique(history.zones, propertyZone);
      history.titles = appendUnique(history.titles, propertyTitle);
      history.lastForm = {
        titulo: propertyTitle,
        tipo_negocio: propertyBusiness,
        tipo_inmueble: propertyType,
        ciudad: propertyCity,
        zona: propertyZone || '',
        area_m2: propertyArea || '',
        habitaciones: propertyBedrooms || '',
        banos: propertyBathrooms || '',
        precio: propertyPrice || '',
        descripcion: propertyDescription || ''
      };
      saveFormHistory(history);
      applyHistorySuggestions();
      uploadForm.reset();
      uploadForm.classList.remove('was-validated');
      updatePricePreview();
      await suggestNextConsecutiveCode(true);
      await loadInmueblesFromSupabase();
    });

    supabaseClient?.auth.onAuthStateChange((_event, session) => setPanels(session));
  })();

  document.addEventListener('DOMContentLoaded', () => {
    loadInmueblesFromSupabase();
  });

  // ========= Noticias: render siempre visible + actualización automática =========
  (function setupNews(){
    const list = document.getElementById('news-list');
    const count = document.getElementById('news-count');
    const search = document.getElementById('news-search');
    const tagsWrap = document.getElementById('news-tags');
    const lastUpdate = document.getElementById('news-last-update');
    if (!list || !count) return;

    let allItems = [...NEWS_FALLBACK_ITEMS];
    let activeTag = null;

    function fmtDate(iso){
      if(!iso) return '';
      const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
      return d.toLocaleDateString('es-CO',{year:'numeric',month:'short',day:'2-digit'});
    }

    function inferTags(title){
      const t = (title || '').toLowerCase();
      const tags = [];
      if (/(arriendo|arrendamiento|canon)/.test(t)) tags.push('Arriendos');
      if (/(venta|comprar|precio)/.test(t)) tags.push('Venta');
      if (/(vivienda|casa|apartamento|inmueble)/.test(t)) tags.push('Vivienda');
      if (/(medell[ií]n|antioquia)/.test(t)) tags.push('Medellín');
      if (/(norma|ley|decreto|propiedad horizontal)/.test(t)) tags.push('Normatividad');
      return tags.length ? tags : ['Mercado'];
    }

    function safeUrl(url){
      try{
        const u = new URL(url, window.location.origin);
        return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : '#';
      } catch (_err){
        return '#';
      }
    }

    async function fetchNewsFromRss(){
      const proxy = 'https://api.allorigins.win/raw?url=';
      const requests = NEWS_RSS_SOURCES.map(async (src) => {
        try{
          const response = await fetch(`${proxy}${encodeURIComponent(src.url)}`, { cache: 'no-store' });
          if (!response.ok) return [];
          const xmlText = await response.text();
          const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
          const items = Array.from(doc.querySelectorAll('item')).slice(0, 8);
          return items.map((item) => {
            const title = item.querySelector('title')?.textContent?.trim() || '';
            const link = item.querySelector('link')?.textContent?.trim() || '#';
            const pubDateRaw = item.querySelector('pubDate')?.textContent?.trim() || '';
            const sourceLabel = item.querySelector('source')?.textContent?.trim() || src.source;
            const dt = pubDateRaw ? new Date(pubDateRaw) : null;
            const dateIso = dt && !Number.isNaN(dt.getTime()) ? dt.toISOString().slice(0, 10) : '';
            return { title, url: link, source: sourceLabel, date: dateIso, tags: inferTags(title) };
          }).filter((n) => n.title && n.url && n.url !== '#');
        } catch (_err){
          return [];
        }
      });

      const results = (await Promise.all(requests)).flat();
      const unique = new Map();
      results.forEach((item) => {
        const key = `${item.url}|${item.title}`.toLowerCase();
        if (!unique.has(key)) unique.set(key, item);
      });
      return Array.from(unique.values())
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 18);
    }

    function renderTags(items){
      if(!tagsWrap) return;
      const allTags = Array.from(new Set(items.flatMap(n => n.tags || []))).sort();
      tagsWrap.innerHTML = '';
      const any = document.createElement('button');
      any.className = 'btn btn-sm btn-light rounded-pill';
      any.textContent = 'Todas';
      if(!activeTag) any.classList.add('active');
      any.onclick = ()=>{ activeTag = null; apply(); };
      tagsWrap.appendChild(any);

      allTags.forEach((t) => {
        const b = document.createElement('button');
        b.className = 'btn btn-sm btn-light rounded-pill';
        b.textContent = t;
        if(activeTag===t) b.classList.add('active');
        b.onclick = ()=>{ activeTag = (activeTag===t ? null : t); apply(); };
        tagsWrap.appendChild(b);
      });
    }

    function renderList(items){
      list.innerHTML = '';
      if(!items.length){
        list.innerHTML = '<li class="list-group-item text-center text-muted">No hay resultados.</li>';
        count.textContent = '0 noticias';
        return;
      }
      items
        .sort((a,b)=> (b.date||'').localeCompare(a.date||''))
        .forEach((n)=>{
          const url = safeUrl(n.url || '#');
          const title = escapeHtml(n.title || 'Sin título');
          const source = escapeHtml(n.source || 'Fuente');
          const li = document.createElement('li');
          li.className = 'list-group-item';
          li.innerHTML = `
            <a class="d-flex align-items-center gap-2 text-decoration-none" href="${url}" target="_blank" rel="noopener">
              <i class="fa-regular fa-newspaper"></i>
              <div class="flex-grow-1">
                <div class="fw-semibold">${title}</div>
                <div class="text-muted small">${source} · <time datetime="${n.date||''}">${fmtDate(n.date||'')}</time></div>
                ${(n.tags||[]).map(t=>`<span class="badge bg-light text-dark me-1">${t}</span>`).join('')}
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>`;
          list.appendChild(li);
        });
      count.textContent = `${items.length} noticias`;
    }

    function apply(){
      const q = (search?.value || '').toLowerCase().trim();
      const items = allItems.filter((n)=>{
        const inText = [n.title,n.source,(n.tags||[]).join(' ')].join(' ').toLowerCase().includes(q);
        const inTag = !activeTag || (n.tags||[]).includes(activeTag);
        return inText && inTag;
      });
      renderTags(allItems);
      renderList(items);
    }

    async function refreshNews(){
      lastUpdate && (lastUpdate.textContent = 'Actualizando titulares...');
      const remoteItems = await fetchNewsFromRss();
      if (remoteItems.length){
        allItems = remoteItems;
        lastUpdate && (lastUpdate.textContent = `Actualizado: ${new Date().toLocaleString('es-CO')}`);
      } else {
        allItems = [...NEWS_FALLBACK_ITEMS];
        lastUpdate && (lastUpdate.textContent = `Mostrando respaldo local (${new Date().toLocaleDateString('es-CO')})`);
      }
      apply();
    }

    search?.addEventListener('input', apply);
    apply();
    refreshNews();
    setInterval(refreshNews, 30 * 60 * 1000);
  })();

  // ========= Navbar "active" por sección =========
  document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.navbar .nav-link');
    const ids = Array.from(links).map(a => a.getAttribute('href')).filter(h=>h && h.startsWith('#'));
    const sections = ids.map(id => document.querySelector(id)).filter(Boolean);

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = '#' + entry.target.id;
        const link = document.querySelector('.navbar .nav-link[href="'+id+'"]');
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(a => a.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

    sections.forEach(sec => obs.observe(sec));

    // barra inferior fija: abrir formularios
    document.getElementById('quick-open-formularios')?.addEventListener('click', () => {
      const modalEl = document.getElementById('modalFormularios');
      if (!modalEl) return;
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
    });

    // animaciones suaves por bloques
    const revealTargets = document.querySelectorAll(
      '.banner .container > *, .icon-card, #inmuebles .property-card, #inmuebles .service-item, #noticias .list-group-item, #nosotros .card, #contacto .card, .modal .card, footer .container > *'
    );
    revealTargets.forEach((el, idx) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min((idx % 6) * 70, 350)}ms`;
    });
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => revealObserver.observe(el));
  });

  // ========= Validación + envío a WhatsApp (Contacto y PQRSF) =========
  (function formsWhatsApp(){
    function show(el){ el?.classList.remove('d-none'); }
    function hide(el){ el?.classList.add('d-none'); }

    // Contacto
    const f1 = document.getElementById('form-contacto');
    const ok1 = document.getElementById('msg-ok');
    const er1 = document.getElementById('msg-error');
    f1?.addEventListener('submit', (e)=>{
      e.preventDefault(); e.stopPropagation();
      if (!f1.checkValidity()){ f1.classList.add('was-validated'); return; }
      if (document.getElementById('website')?.value.trim()!=='') return;

      const nombre = document.getElementById('nombre').value.trim();
      const email  = document.getElementById('email').value.trim();
      const tel    = document.getElementById('telefono').value.trim();
      const msg    = document.getElementById('mensaje').value.trim();

      const texto = `Contacto ZCI:\n- Nombre: ${nombre}\n- Correo: ${email}\n- Tel: ${tel}\n- Mensaje: ${msg}`;
      const url = 'https://wa.me/573186781547?text=' + encodeURIComponent(texto);
      window.open(url, '_blank', 'noopener');
      hide(er1); show(ok1);
      f1.reset(); f1.classList.remove('was-validated');
    });

    // PQRSF
    const f2 = document.getElementById('form-pqr');
    const ok2 = document.getElementById('pqr-ok');
    const er2 = document.getElementById('pqr-error');
    f2?.addEventListener('submit', (e)=>{
      e.preventDefault(); e.stopPropagation();
      if (!f2.checkValidity()){ f2.classList.add('was-validated'); return; }
      if (document.getElementById('pqr-website')?.value.trim()!=='') return;

      const tipo   = document.getElementById('pqr-tipo').value;
      const nombre = document.getElementById('pqr-nombre').value.trim();
      const doc    = document.getElementById('pqr-doc').value.trim();
      const email  = document.getElementById('pqr-email').value.trim();
      const tel    = document.getElementById('pqr-tel').value.trim();
      const canal  = document.getElementById('pqr-canal').value;
      const asunto = document.getElementById('pqr-asunto').value.trim();
      const desc   = document.getElementById('pqr-desc').value.trim();

      const texto = `PQRSF ZCI:
- Tipo: ${tipo}
- Nombre: ${nombre}
- Doc: ${doc}
- Correo: ${email}
- Tel: ${tel}
- Canal: ${canal}
- Asunto: ${asunto}
- Descripción: ${desc}`;
      const url = 'https://wa.me/573186781547?text=' + encodeURIComponent(texto);
      window.open(url, '_blank', 'noopener');
      hide(er2); show(ok2);
      f2.reset(); f2.classList.remove('was-validated');
    });
  })();

  // ========= Footer: anio actual =========
  (function setFooterYear(){
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  })();

