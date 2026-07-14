type DesktopBridge = import("@nightthread/desktop-contract").DesktopBridge;
type DesktopShellState = import("@nightthread/desktop-contract").DesktopShellState;
type DesktopUpdateState = import("@nightthread/desktop-contract").DesktopUpdateState;

const exposedBridge = (window as Window & { nightthreadDesktop?: DesktopBridge }).nightthreadDesktop;
if (!exposedBridge) throw new Error("Nightthread desktop bridge is unavailable");
const bridge: DesktopBridge = exposedBridge;

const title = requiredElement("title");
const message = requiredElement("message");
const code = requiredElement("user-code");
const primary = requiredButton("primary-action");
const update = requiredButton("update-action");
const version = requiredElement("version");

version.textContent = `Version ${bridge.appVersion}`;

bridge.onShellState(renderShellState);
bridge.onUpdateState(renderUpdateState);

function renderShellState(state: DesktopShellState): void {
  message.textContent = state.message;
  code.hidden = true;
  primary.hidden = false;
  primary.disabled = false;
  primary.onclick = null;
  if (state.phase === "starting") {
    title.textContent = "Starting Nightthread";
    primary.hidden = true;
  } else if (state.phase === "signed-out") {
    title.textContent = "Your trips, together";
    primary.textContent = "Sign in in browser";
    primary.onclick = () => void bridge.beginSignIn();
  } else if (state.phase === "authorizing") {
    title.textContent = "Finish in your browser";
    code.hidden = false;
    code.textContent = state.userCode;
    primary.textContent = "Waiting for approval…";
    primary.disabled = true;
  } else if (state.phase === "offline") {
    title.textContent = "Nightthread is offline";
    primary.textContent = "Retry";
    primary.onclick = () => void bridge.retry();
  } else {
    title.textContent = "Nightthread needs attention";
    primary.textContent = "Reload";
    primary.onclick = () => void bridge.reload();
  }
}

function renderUpdateState(state: DesktopUpdateState): void {
  if (state.phase === "ready") {
    update.hidden = false;
    update.textContent = `Restart into ${state.version}`;
    update.onclick = () => void bridge.installUpdate();
    return;
  }
  if (state.phase === "available" || state.phase === "downloading") {
    update.hidden = false;
    update.disabled = true;
    update.textContent = state.phase === "downloading" ? `Downloading update ${state.percent}%` : `Update ${state.version} available`;
    return;
  }
  update.hidden = true;
}

function requiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing shell element: ${id}`);
  return element;
}

function requiredButton(id: string): HTMLButtonElement {
  const element = requiredElement(id);
  if (!(element instanceof HTMLButtonElement)) throw new Error(`Shell element is not a button: ${id}`);
  return element;
}
