export default class ZoomToRouteControl {
  constructor(onClick) {
    this.onClick = onClick;
  }

  onAdd() {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

    const button = document.createElement('button');
    button.type = 'button';
    button.title = 'Zoom to full route';
    button.textContent = '⤢';

    button.onclick = () => this.onClick();

    container.appendChild(button);
    this.container = container;
    return container;
  }

  onRemove() {
    this.container?.remove();
  }
}
