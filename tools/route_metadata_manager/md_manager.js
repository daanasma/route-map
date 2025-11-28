let data = null;
let pointsData = [];
let linesData = [];
let projectLoaded = false;
let unsavedChanges = false;
let currentStepForFeatures = null;
let selectedFeatures = [];

function showError(message) {
    const container = document.getElementById('errorContainer');
    container.innerHTML = `<div class="error-message">${message}</div>`;
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function markUnsaved() {
    unsavedChanges = true;
    document.getElementById('unsavedIndicator').style.display = 'inline-block';
}

function clearUnsaved() {
    unsavedChanges = false;
    document.getElementById('unsavedIndicator').style.display = 'none';
}

async function loadProjectFolder(event) {
    const files = Array.from(event.target.files);
    let routeInfoFile = null;
    let segmentsFile = null;
    let pointsFile = null;

    // Find the required files
    for (const file of files) {
        if (file.name === 'route_info.json') {
            routeInfoFile = file;
        } else if (file.name === 'segments.geojson') {
            segmentsFile = file;
        } else if (file.name === 'points.geojson') {
            pointsFile = file;
        }
    }

    // Validate all files are present
    if (!routeInfoFile || !segmentsFile || !pointsFile) {
        showError('Missing required files. Please ensure folder contains: route_info.json, segments.geojson, and points.geojson');
        return;
    }

    try {
        // Load route_info.json
        const routeInfoText = await routeInfoFile.text();
        data = JSON.parse(routeInfoText);
        if (!data.settings) data.settings = {};

        // Load segments.geojson
        const segmentsText = await segmentsFile.text();
        const segmentsGeoJSON = JSON.parse(segmentsText);
        linesData = segmentsGeoJSON.features.map(f => ({
            id: f.properties.id || f.id,
            title: f.properties.title || `Segment ${f.properties.id || f.id}`,
            description: f.properties.description || ''
        }));

        // Load points.geojson
        const pointsText = await pointsFile.text();
        const pointsGeoJSON = JSON.parse(pointsText);
        pointsData = pointsGeoJSON.features.map(f => ({
            id: f.properties.id || f.id,
            title: f.properties.title || `Point ${f.properties.id || f.id}`,
            description: f.properties.description || ''
        }));

        projectLoaded = true;
        displayProjectInfo();
        enableEditor();
        loadMetadata();
        renderSteps();
        clearUnsaved();

    } catch (error) {
        showError(`Failed to load project: ${error.message}`);
        console.error(error);
    }
}

function displayProjectInfo() {
    const info = document.getElementById('projectInfo');
    info.style.display = 'block';
    info.className = 'project-info';
    info.innerHTML = `
                <h3>✓ Project Loaded</h3>
                <p><strong>Route:</strong> ${data.metadata.title}</p>
                <p><strong>Features:</strong> ${pointsData.length} points, ${linesData.length} segments</p>
                <p><strong>Steps:</strong> ${data.sequence.length}</p>
            `;
    document.getElementById('loadSection').style.display = 'none';
}

function enableEditor() {
    document.getElementById('editorSection').classList.remove('disabled');
    document.getElementById('stepsSection').classList.remove('disabled');
    document.getElementById('exportSection').classList.remove('disabled');
}

function loadMetadata() {
    document.getElementById('metaTitle').value = data.metadata.title || '';
    document.getElementById('metaDescription').value = data.metadata.description || '';
    document.getElementById('metaBanner').value = data.metadata.banner || '';
                document.getElementById('metaCircular').checked = data.metadata.circular === true;
    document.getElementById('metaVersion').value = data.metadata.version || '1.0';
    document.getElementById('metaCreated').value = data.metadata.created || '';
    document.getElementById('metaLastEdit').value = data.metadata.last_edit || '';
}

function saveMetadata() {
    data.metadata.title = document.getElementById('metaTitle').value;
    data.metadata.description = document.getElementById('metaDescription').value;
    data.metadata.banner = document.getElementById('metaBanner').value;
    data.metadata.circular = document.getElementById('metaCircular').checked;
    data.metadata.version = document.getElementById('metaVersion').value;
    data.metadata.created = document.getElementById('metaCreated').value;

    // Auto-update last edit date
    const today = new Date().toISOString().split('T')[0];
    data.metadata.last_edit = today;
    document.getElementById('metaLastEdit').value = today;
}

function validateFeatureExists(id, type) {
    const source = type === 'point' ? pointsData : linesData;
    return source.some(f => f.id === id);
}

function renderSteps() {
    const container = document.getElementById('stepsList');
    container.innerHTML = '';

    data.sequence.sort((a, b) => a.route_step - b.route_step);
    data.sequence.forEach((step, idx) => {
        const div = document.createElement('div');
        div.className = 'step-item';
        div.innerHTML = `
                    <div class="step-header" onclick="toggleStep(${idx})">
                        <div class="step-title">Step ${step.route_step}
                            <input type="text" 
                            value="${step.title || ''}" 
                            onchange="updateStepField(${idx}, 'title', this.value)"
                            onclick="event.stopPropagation()">
                        </div>
                        <div class="step-controls">
                            <button onclick="moveStep(${idx}, -1); event.stopPropagation();">↑</button>
                            <button onclick="moveStep(${idx}, 1); event.stopPropagation();">↓</button>
                            <button class="danger" onclick="deleteStep(${idx}); event.stopPropagation();">Delete</button>
                        </div>
                    </div>
                    <div class="step-content" id="stepContent${idx}">
                        <div class="input-group">
                            <label>Description:</label>
                            <textarea onchange="updateStepField(${idx}, 'description', this.value)">${step.description || ''}</textarea>
                        </div>
                        <div>
                            <strong>Features:</strong>
                            <div class="feature-ids" id="features${idx}">
                                ${step.features.map((f, fidx) => {
            const isValid = validateFeatureExists(f.id, f.type);
            const invalidClass = isValid ? '' : ' invalid';
            const warningIcon = isValid ? '' : ' ⚠️';
            const thisDataset = (f.type == 'point') ? pointsData : linesData;
            const thisSpecificItem = thisDataset.find(p=> p.id === f.id);
            console.log('thisSpecificItem', thisSpecificItem)
            const thisSpecificTitle = thisSpecificItem?.title;
            console.log(thisSpecificTitle)
            return ` <div class="feature-tag ${f.type}${invalidClass}">
                        ${f.type}: ${f.id} (${thisSpecificTitle}) ${warningIcon}
                        <button onclick="removeFeature(${idx}, ${fidx})">×</button>
                    </div>
                                    `;
        }).join('')}
                            </div>
                            <button onclick="openFeatureModal(${idx})" class="secondary">Add Features</button>
                        </div>
                    </div>
                `;
        container.appendChild(div);
    });
}

function toggleStep(idx) {
    const content = document.getElementById(`stepContent${idx}`);
    content.classList.toggle('collapsed');
}

function addNewStep() {
    const maxStep = data.sequence.reduce((max, s) => Math.max(max, s.route_step), 0);
    const newStep = {
        route_step: maxStep + 1,
        title: "New Step",
        description: "",
        features: []
    };
    data.sequence.push(newStep);
    renderSteps();
    markUnsaved();
}

function deleteStep(idx) {
    if (confirm('Delete this step?')) {
        data.sequence.splice(idx, 1);
        reindexSteps();
        renderSteps();
        markUnsaved();
    }
}

function moveStep(idx, direction) {
    if (idx + direction < 0 || idx + direction >= data.sequence.length) return;

    const temp = data.sequence[idx].route_step;
    data.sequence[idx].route_step = data.sequence[idx + direction].route_step;
    data.sequence[idx + direction].route_step = temp;

    renderSteps();
    markUnsaved();
}

function reindexSteps() {
    data.sequence.forEach((step, idx) => {
        step.route_step = idx + 1;
    });
}

function updateStepField(idx, field, value) {
    data.sequence[idx][field] = value;
    markUnsaved();
}

function removeFeature(stepIdx, featureIdx) {
    data.sequence[stepIdx].features.splice(featureIdx, 1);
    renderSteps();
    markUnsaved();
}

function openFeatureModal(stepIdx) {
    currentStepForFeatures = stepIdx;
    selectedFeatures = [];

    const modal = document.getElementById('featureModal');
    const list = document.getElementById('featureList');

    list.innerHTML = `
                <h4>Points (${pointsData.length} available)</h4>
                ${pointsData.map(p => `
                    <div class="feature-item" onclick="toggleFeatureSelection(${p.id}, 'point', this)">
                        <input type="checkbox" id="point_${p.id}">
                        <div class="feature-item-content">
                            <strong>${p.name}</strong>
                            <small>ID: ${p.id}</small>
                            ${p.description ? `<div><small>${p.description}</small></div>` : ''}
                        </div>
                    </div>
                `).join('')}
                <h4>Lines (${linesData.length} available)</h4>
                ${linesData.map(l => `
                    <div class="feature-item" onclick="toggleFeatureSelection(${l.id}, 'line', this)">
                        <input type="checkbox" id="line_${l.id}">
                        <div class="feature-item-content">
                            <strong>${l.name}</strong>
                            <small>ID: ${l.id}</small>
                            ${l.description ? `<div><small>${l.description}</small></div>` : ''}
                        </div>
                    </div>
                `).join('')}
            `;

    modal.style.display = 'block';
}

function closeFeatureModal() {
    document.getElementById('featureModal').style.display = 'none';
}

function toggleFeatureSelection(featureId, featureType, element) {
    const checkbox = document.getElementById(`${featureType}_${featureId}`);
    checkbox.checked = !checkbox.checked;
    element.classList.toggle('selected');

    if (checkbox.checked) {
        selectedFeatures.push({id: featureId, type: featureType});
    } else {
        selectedFeatures = selectedFeatures.filter(
            f => !(f.id === featureId && f.type === featureType)
        );
    }
}

function addSelectedFeatures() {
    if (currentStepForFeatures === null) return;

    const step = data.sequence[currentStepForFeatures];
    selectedFeatures.forEach(feature => {
        const exists = step.features.some(
            f => f.id === feature.id && f.type === feature.type
        );
        if (!exists) {
            step.features.push({id: feature.id, type: feature.type});
        }
    });

    closeFeatureModal();
    renderSteps();
    markUnsaved();
}

function saveToFile() {
    if (!projectLoaded) {
        showError('No project loaded');
        return;
    }

    saveMetadata();

    const blob = new Blob([JSON.stringify(data, null, 2)],
        {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'route_info.json';
    a.click();
    URL.revokeObjectURL(url);

    clearUnsaved();
    showError('File saved successfully! ✓');
}

function exportJSON() {
    if (!projectLoaded) {
        showError('No project loaded');
        return;
    }

    saveMetadata();
    const output = document.getElementById('jsonOutput');
    output.value = JSON.stringify(data, null, 2);
}

// Warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
    }
});
