const fileInput = document.getElementById('file-input');
const columnSelect = document.getElementById('column-select');
const hasHeaderCheckbox = document.getElementById('has-header');
const currentQuery = document.getElementById('current-query');
const currentCounter = document.getElementById('current-counter');
const unlabeledHint = document.getElementById('unlabeled-hint');
const progressFill = document.getElementById('progress-fill');
const rowPreview = document.getElementById('row-preview');
const customLabelInput = document.getElementById('custom-label');

const exportBtn = document.getElementById('export-btn');
const labelNaturalBtn = document.getElementById('label-natural');
const labelConventionalBtn = document.getElementById('label-conventional');
const labelCustomBtn = document.getElementById('label-custom');
const clearLabelBtn = document.getElementById('clear-label');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const nextUnlabeledBtn = document.getElementById('next-unlabeled');

const STATE = {
  rawRows: [],
  annotations: [],
  queryColumn: 0,
  currentIndex: 0,
  hasHeader: true,
};

function resetState() {
  STATE.rawRows = [];
  STATE.annotations = [];
  STATE.queryColumn = 0;
  STATE.currentIndex = 0;
  currentQuery.textContent = 'Lade eine CSV, um zu starten.';
  currentCounter.textContent = '0 / 0';
  unlabeledHint.textContent = 'Keine Datei geladen';
  progressFill.style.width = '0%';
  rowPreview.innerHTML = '';
  columnSelect.innerHTML = '';
  columnSelect.disabled = true;
  toggleControls(false);
}

function toggleControls(enabled) {
  [
    exportBtn,
    labelNaturalBtn,
    labelConventionalBtn,
    labelCustomBtn,
    clearLabelBtn,
    prevBtn,
    nextBtn,
    nextUnlabeledBtn,
    columnSelect,
  ].forEach((el) => {
    el.disabled = !enabled;
  });
}

function parseFile(file) {
  resetState();
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    complete: (results) => {
      const rows = results.data;
      if (!rows.length) {
        currentQuery.textContent = 'Die Datei enthält keine Zeilen.';
        return;
      }
      STATE.rawRows = rows.map((row) => (Array.isArray(row) ? row : Object.values(row)));
      STATE.hasHeader = hasHeaderCheckbox.checked;
      STATE.annotations = new Array(STATE.rawRows.length - (STATE.hasHeader ? 1 : 0)).fill('');
      buildColumnSelect();
      updateUI();
      toggleControls(true);
      unlabeledHint.textContent = 'Nutze 1 / 2 / 3 für Labels, Enter für weiter.';
    },
    error: () => {
      currentQuery.textContent = 'Fehler beim Lesen der Datei.';
    },
  });
}

function buildColumnSelect() {
  columnSelect.innerHTML = '';
  const headerRow = STATE.rawRows[0];
  headerRow.forEach((value, idx) => {
    const option = document.createElement('option');
    const label = value && STATE.hasHeader ? value : `Spalte ${idx + 1}`;
    option.value = idx;
    option.textContent = label;
    columnSelect.appendChild(option);
  });
  columnSelect.value = STATE.queryColumn;
  columnSelect.disabled = false;
}

function getDataRows() {
  return STATE.hasHeader ? STATE.rawRows.slice(1) : STATE.rawRows;
}

function getCurrentRow() {
  const dataRows = getDataRows();
  return dataRows[STATE.currentIndex] || [];
}

function setAnnotation(label) {
  if (!STATE.annotations.length) return;
  STATE.annotations[STATE.currentIndex] = label;
  moveToNext();
}

function clearAnnotation() {
  if (!STATE.annotations.length) return;
  STATE.annotations[STATE.currentIndex] = '';
  updateUI();
}

function moveToNext() {
  if (STATE.currentIndex < STATE.annotations.length - 1) {
    STATE.currentIndex += 1;
  }
  updateUI();
}

function moveToPrev() {
  if (STATE.currentIndex > 0) {
    STATE.currentIndex -= 1;
  }
  updateUI();
}

function jumpToNextUnlabeled() {
  const nextIndex = STATE.annotations.findIndex((item, idx) => item === '' && idx > STATE.currentIndex);
  if (nextIndex !== -1) {
    STATE.currentIndex = nextIndex;
  } else {
    const first = STATE.annotations.findIndex((item) => item === '');
    if (first !== -1) STATE.currentIndex = first;
  }
  updateUI();
}

function updateUI() {
  const rows = getDataRows();
  const total = rows.length;
  if (!total) return;

  const row = rows[STATE.currentIndex] || [];
  const query = row[STATE.queryColumn] ?? '—';
  currentQuery.textContent = query || '—';

  const labeledCount = STATE.annotations.filter((a) => a !== '').length;
  currentCounter.textContent = `${STATE.currentIndex + 1} / ${total}`;
  unlabeledHint.textContent = `${labeledCount} von ${total} Zeilen sind annotiert.`;
  progressFill.style.width = `${Math.round((labeledCount / total) * 100)}%`;

  renderPreview(row);
  highlightButtons();
}

function renderPreview(row) {
  rowPreview.innerHTML = '';
  const headerRow = STATE.hasHeader ? STATE.rawRows[0] : [];
  row.forEach((value, idx) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    const title = headerRow[idx] || `Spalte ${idx + 1}`;
    item.innerHTML = `<strong>${title}</strong>${value ?? '—'}`;
    if (idx === Number(STATE.queryColumn)) item.classList.add('highlight');
    rowPreview.appendChild(item);
  });

  const annotation = STATE.annotations[STATE.currentIndex] || '—';
  const annotationItem = document.createElement('div');
  annotationItem.className = 'preview-item';
  annotationItem.innerHTML = `<strong>Annotation</strong>${annotation}`;
  rowPreview.appendChild(annotationItem);
}

function highlightButtons() {
  const currentLabel = STATE.annotations[STATE.currentIndex] || '';
  [labelNaturalBtn, labelConventionalBtn, labelCustomBtn].forEach((btn) => {
    btn.classList.remove('active');
  });

  if (currentLabel === 'natürlich') labelNaturalBtn.classList.add('active');
  if (currentLabel === 'konventionell') labelConventionalBtn.classList.add('active');
  if (currentLabel && !['natürlich', 'konventionell'].includes(currentLabel)) {
    labelCustomBtn.classList.add('active');
  }
}

function buildAnnotatedCsv() {
  const clonedRows = STATE.rawRows.map((row) => [...row]);
  const offset = STATE.hasHeader ? 1 : 0;

  if (STATE.hasHeader) {
    const header = clonedRows[0];
    header.splice(Number(STATE.queryColumn) + 1, 0, 'Annotation');
  }

  for (let i = offset; i < clonedRows.length; i += 1) {
    const annotation = STATE.annotations[i - offset] || '';
    const row = clonedRows[i];
    row.splice(Number(STATE.queryColumn) + 1, 0, annotation);
  }

  return Papa.unparse(clonedRows);
}

function downloadCsv() {
  const csv = buildAnnotatedCsv();
  // Prepend UTF-8 BOM to keep Umlaut characters like "natürlich" intact in Excel exports.
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'annotated_queries.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function handleKeyboard(event) {
  if (!STATE.annotations.length) return;
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    if (document.activeElement !== customLabelInput) return;
  }

  switch (event.key) {
    case '1':
      setAnnotation('natürlich');
      break;
    case '2':
      setAnnotation('konventionell');
      break;
    case '3': {
      const customValue = customLabelInput.value.trim();
      if (customValue) setAnnotation(customValue);
      break;
    }
    case 'Backspace':
      event.preventDefault();
      clearAnnotation();
      break;
    case 'ArrowRight':
    case 'Enter':
      moveToNext();
      break;
    case 'ArrowLeft':
      moveToPrev();
      break;
    default:
      break;
  }
}

// Event wiring
fileInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (file) parseFile(file);
});

hasHeaderCheckbox.addEventListener('change', () => {
  STATE.hasHeader = hasHeaderCheckbox.checked;
  if (STATE.rawRows.length) {
    STATE.annotations = new Array(STATE.rawRows.length - (STATE.hasHeader ? 1 : 0)).fill('');
    STATE.currentIndex = 0;
    buildColumnSelect();
    updateUI();
  }
});

columnSelect.addEventListener('change', (event) => {
  STATE.queryColumn = Number(event.target.value);
  updateUI();
});

labelNaturalBtn.addEventListener('click', () => setAnnotation('natürlich'));
labelConventionalBtn.addEventListener('click', () => setAnnotation('konventionell'));
labelCustomBtn.addEventListener('click', () => {
  const value = customLabelInput.value.trim();
  if (value) setAnnotation(value);
});
clearLabelBtn.addEventListener('click', clearAnnotation);
prevBtn.addEventListener('click', moveToPrev);
nextBtn.addEventListener('click', moveToNext);
nextUnlabeledBtn.addEventListener('click', jumpToNextUnlabeled);
exportBtn.addEventListener('click', downloadCsv);

document.addEventListener('keydown', handleKeyboard);

resetState();
