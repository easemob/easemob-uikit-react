import { MemberItem } from '../../store/AddressStore';
import { getGroupMemberNickName } from '../../utils';
import { MENTION_TAG } from './const';

const MentionRegx = new RegExp(`${MENTION_TAG}([^${MENTION_TAG}\\s]*)$`); //

// get cursor
const getCursorIndex = () => {
  const selection = window.getSelection();
  return selection?.focusOffset;
};

// get range node
const getRangeNode = () => {
  const selection = window.getSelection();
  const node = selection?.focusNode;
  return node;
};

const getRangeRect = () => {
  const selection = window.getSelection() as Selection;
  const range = selection?.getRangeAt?.(0);
  const rect = range.getClientRects()[0];
  const LINE_HEIGHT = 0;
  return {
    x: rect.x,
    y: rect.y + LINE_HEIGHT,
  };
};

// is show  @
const showAt = () => {
  const node = getRangeNode();
  if (!node || node.nodeType !== Node.TEXT_NODE) return false;
  const content = node.textContent || '';
  const regx = MentionRegx;
  const match = regx.exec(content.slice(0, getCursorIndex()));
  return match && match.length === 2;
};

// get @ user
const getAtUser = () => {
  const content = getRangeNode()?.textContent || '';
  const regx = MentionRegx;
  const match = regx.exec(content.slice(0, getCursorIndex()));
  if (match && match.length === 2) {
    return match[1];
  }
  return undefined;
};

const createAtButton = (user: MemberItem) => {
  const btn = document.createElement('span');
  btn.style.display = 'inline-block';
  btn.dataset.user = user.userId;
  btn.className = 'at-button';
  btn.contentEditable = 'false';
  btn.textContent = `${MENTION_TAG}${getGroupMemberNickName(user)}`;
  const wrapper = document.createElement('span');
  wrapper.style.display = 'inline-block';
  wrapper.contentEditable = 'false';
  const spaceElem = document.createElement('span');
  spaceElem.style.whiteSpace = 'pre';
  spaceElem.textContent = '\u200b';
  spaceElem.contentEditable = 'false';
  const clonedSpaceElem = spaceElem.cloneNode(true);
  wrapper.appendChild(spaceElem);
  wrapper.appendChild(btn);
  wrapper.appendChild(clonedSpaceElem);
  return wrapper;
};

const replaceString = (raw: string, replacer: string) => {
  return raw.replace(MentionRegx, replacer);
};

const replaceAtUser = (user: MemberItem) => {
  const node = getRangeNode();

  if (node) {
    const content = node?.textContent || '';
    const endIndex = getCursorIndex();
    const preSlice = replaceString(content.slice(0, endIndex), '');
    const restSlice = content.slice(endIndex);
    const parentNode = node?.parentNode as any as Element;
    const nextNode = node?.nextSibling;
    const previousTextNode = new Text(preSlice);
    const nextTextNode = new Text('\u200b' + restSlice);

    const atButton = createAtButton(user);
    parentNode.removeChild(node);

    if (nextNode) {
      parentNode.insertBefore(previousTextNode, nextNode);
      parentNode.insertBefore(atButton, nextNode);
      parentNode.append(' ');
      parentNode.insertBefore(nextTextNode, nextNode);
    } else {
      parentNode.appendChild(previousTextNode);
      parentNode.appendChild(atButton);
      parentNode.append(' ');
      parentNode.appendChild(nextTextNode);
    }
    setTimeout(() => {
      const range = new Range();
      range.setStart(nextTextNode, 0);
      range.setEnd(nextTextNode, 0);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 10);
  }
};

const isSafariVersionGreaterThan17 = () => {
  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);

  if (isSafari) {
    const versionMatch = userAgent.match(/Version\/(\d+(\.\d+)?)/);
    if (versionMatch && versionMatch[1]) {
      const version = parseFloat(versionMatch[1]);
      return version > 17;
    }
  }

  return false;
};

export {
  getCursorIndex,
  getRangeNode,
  getRangeRect,
  showAt,
  getAtUser,
  createAtButton,
  replaceString,
  replaceAtUser,
  isSafariVersionGreaterThan17,
};
