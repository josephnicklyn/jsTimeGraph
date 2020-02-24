// utils.js
function removeNonNodeChildren(elm) {
    let cnt = 0;
    if (elm instanceof HTMLElement) {
        for(let i = elm.childNodes.length-1; i >= 0; i--) {
            let node = elm.childNodes[i];
            if (!(node instanceof HTMLElement)) {
                elm.removeChild(node);
                cnt++;
            }
        }
    }
    return cnt;
}

function getAncestorByTagOrClassName(target, name) {
    if (target instanceof HTMLElement) {
        while(target) {
            if (target instanceof HTMLElement) {
                if (target.tagName === name 
                    || target.classList.contains(name))
                    return target;
            }
            target = target.parentNode;
        }
    }
    return target;
}

function getAncesotryByType(target, type) {
    if (target instanceof HTMLElement) {
        while(target) {
            if (target instanceof type) {
                    return target;
            }
            target = target.parentNode;
        }
    }
    return target;
}

function getElementSize(elm) {
    let results = {width:0, height:0};
    if (elm instanceof HTMLElement) {
        let styles = window.getComputedStyle(elm);
        // console.log(styles);
        results.width = sumOfStyles(
            styles, ['margin-left', 'border-left-width', 'padding-left',
                     'margin-right', 'border-right-width', 'padding-right', 'width']);
        results.height = sumOfStyles(
            styles, ['margin-top', 'border-top-width', 'padding-top',
                     'margin-bottom', 'border-bottom-width', 'padding-bottom', 'height']);;
    }
    return results;
}
function toBoolean(v) {
    return (v === 'true' || v === true)?true:false;
}

function toInteger(v, def) {
    let r = typeof(def) === 'number'?def:0;
    try {
        let q = parseInt(v);
        if (!isNaN(q)) r = q;
    } catch(e) {}
    return r;
}

function toFloat(v, def) {
    let r = typeof(def) === 'number'?def:0;
    try {
        let q = parseFloat(v);
        if (!isNaN(q)) r = q;
    } catch(e) {}
    return r;
}



function sumOfStyles(style, items) {
    let v = 0;
    for(let i of items) {
        let s = toFloat(style.getPropertyValue(i));
        v+=s;
    }
    return v;
}

var isMobile =   // will be true if running on a mobile device
  navigator.userAgent.indexOf( "Mobile" ) !== -1 || 
  navigator.userAgent.indexOf( "iPhone" ) !== -1 || 
  navigator.userAgent.indexOf( "Android" ) !== -1 || 
  navigator.userAgent.indexOf( "Windows Phone" ) !== -1 ;

 
function PullScroll(selectBinder, className) {
    this.elm = document.createElement('div');
        this.elm.className = className;
    if (isMobile) {
        this.elm.classList.add('auto-scroll');
    }
    this.selectBinder = selectBinder;
    this.elm.addEventListener('mousedown', this.onEvent.bind(this));
    this.elm.addEventListener('mousemove', this.onEvent.bind(this));
    this.elm.addEventListener('mouseup', this.onEvent.bind(this));

    this.hints = {};
}

PullScroll.prototype.appendChild = function(child) {
    if (child instanceof HTMLElement) {
        this.elm.appendChild(child);
    }
}

PullScroll.prototype.prepend = function(child) {
    if (child instanceof HTMLElement) {
        this.elm.prepend(child);
    }
}


PullScroll.prototype.insertBefore = function(child, relativeTo) {
    if (child instanceof HTMLElement && (relativeTo instanceof HTMLElement || relativeTo === null)) {
        this.elm.insertBefore(child, relativeTo);
    }
}

PullScroll.prototype.onEvent = function(e) {
    if (e.which === 1) {
        if (e.type === 'mousedown') {
            this.hints.x = e.x;
            this.hints.y = e.y;
            this.hints.fromhere = true;
            this.hints.left = this.elm.scrollLeft;
            this.hints.top = this.elm.scrollTop;

        } else if (e.type === 'mousemove' && this.hints.fromhere) {
            if (!isMobile) {
                e.preventDefault();
                e.cancelBubble = true;
                let x = (this.hints.x - e.x) + this.hints.left;
                let y =  (this.hints.y - e.y) + this.hints.top;
                this.elm.scrollTop = y;
                this.elm.scrollLeft = x;
            }
        } else if (e.type === 'mouseup') {
            let x = Math.abs(this.hints.x - e.x);
            let y =  Math.abs(this.hints.y - e.y);
            if ((x == 0 && y == 0) || isMobile) {
                this.selectBinder(e);
            }
            this.hints.fromhere = false;
        }
    }
}

const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        if (entry.target.onResize instanceof Function)
            entry.target.onResize(entry.contentRect);
        }
  });

  
function createElement(className, parentNode, innerHTML, type) {
    let elm = document.createElement('div');//(typeof(type)==='string'?type:'div'));
        elm.className = className;
    if (parentNode) {
        parentNode.appendChild(elm);
    }
    if (innerHTML != undefined) {
        
        if (typeof(innerHTML) !== HTMLElement) {
            let t = document.createElement('div');
                t.innerHTML = innerHTML;
                elm.appendChild(t);
        } else {
            if (innerHTML.parentNode) 
                innerHTML.parentNode.removeChild(innerHTML);
            elm.appendChild(innerHTML);
        } 
    }
    return elm;
}

function getAttribute(elm, name, def, updateValue) {
    let attr = elm.getAttribute(name);
    
    if (def instanceof Array) {
        for(let i of def) {
            let v = typeof(i) === 'string'?i.toLowerCase():i;
            if (def == v) {
                attr = v;
            }
        }
        if (def.length > 0) {
            attr = def[0];
        } 
        if (updateValue === true)
            elm.setAttribute(name, attr);
        return attr;
    }
    
    if (!attr) {
        attr = def;
    }
    return attr;
}
// web-tab.js
class UXTabView extends HTMLElement {
    constructor() {
        super();
        this.classList.add('ux-tabview');
        this.connected = false;
        this.tabBar = new PullScroll(this.onTabClicked.bind(this), 'tabbar');
        this.onCloseTab = this.getAttribute('onclose');
        this.style.display = 'flex';
        this.tabs = [];
        this.tabsCount = 0;
        this.selectedItem = null;
        this.placeHolder = null;
        this.closeables = document.createElement('div');
            this.closeables.className = 'sidebar';
        this.tabBar.appendChild(this.closeables);
    }

    connectedCallback() {        
        removeNonNodeChildren(this);
        if (this.connected)
            return;
        for(let child of this.children) {
            if (child.tagName === 'DIV' && !child.getAttribute('label') && this.placeHolder === null) {
                this.placeHolder = child;
                this.placeHolder.classList.add('user-content');
                this.placeHolder.style.display = 'none';
                continue;
            } else  if (child.tagName === 'DIV') {
                this.addItem(child);
            } else {

            }
        }
        this.style.visibility = 'visible';
        this.prepend(this.tabBar.elm);
        if (!this.placeHolder && !this.selectedItem)
            this.select(0);
        else 
            this.select(this.selectedItem);
        this.connected = true;
    }

    addItem(tabitem) {
      
        if (!(tabitem instanceof HTMLElement) 
            || (tabitem.tagName !== 'DIV')
         ) {
            throw "Only a 'div' may be the child of a 'UX-TABVIEW' -> got '"
                    + ((tabitem instanceof HTMLElement)?tabitem.tagName:tabitem) + "'.";
        } else {
            if (tabitem.parentNode && tabitem.parentNode !== this) {
                tabitem.parentNode.removeChild(tabitem);
            }

            if (!tabitem.parentNode) {
                this.appendChild(tabitem);
            }
            this.tabsCount++;
            tabitem.classList.add('user-content', 'border-etched');
            let selected = tabitem.getAttribute('selected');
                selected = (selected === true || selected === 'true')?true:false;
            let closeable = tabitem.getAttribute('closeable');
            closeable = ((closeable === true || closeable === 'true')?true:false|this.connected);
            let text = tabitem.getAttribute('label');
                if (typeof(text) !== 'string') 
                    text = "Tab " + (this.tabsCount);

            let tabbutton = document.createElement('div');
                tabbutton.className = 'tab-button';
                tabbutton.setAttribute('title', (text));
            let label = document.createElement('label');
                label.innerText = text;
            tabbutton.appendChild(label);
            let obj =  {
                tabbutton:tabbutton,
                tabitem: tabitem
            };
            if (closeable) {
                let closeButton = document.createElement('div');
                    closeButton.innerHTML = '&#xd7;';
                    closeButton.className = 'close-button';
                    closeButton.setAttribute('title', ('Close ' + text));
                tabbutton.appendChild(closeButton);
                closeButton.USER_DATA = obj;
            }            
            this.tabs.push(
                obj
            );

            if (closeable) {
                this.closeables.prepend(tabbutton);
            } else {
                this.tabBar.insertBefore(tabbutton, this.closeables);
            }
            if (this.connected === true) {
                this.selectedItem = tabbutton;
                tabitem.style.display = 'none';
                this.select(tabbutton);
            } else if (selected === true) {
                this.selectedItem = tabbutton;
                tabitem.style.display = 'none';
            } 
            
        }
    }

    select(target) {
        if (target === null && this.placeHolder)
            this.placeHolder.style.display = '';
        
        if (typeof(target) === 'number') {
            target = Math.floor(target);
            if (target < 0) 
                target = this.tabs.length -1;
            if (target < 0) target = 0;
            target = this.tabs[target].tabbutton;
        }
        let oneOn = false;
        for(let tab of this.tabs) {
            if (tab === target || tab.tabbutton === target) {
                if (tab.tabitem.style.display === '' && this.placeHolder) {
                    tab.tabitem.style.display = 'none';
                    tab.tabbutton.classList.remove('selected');
                } else {
                    tab.tabitem.style.display = '';
                    tab.tabbutton.classList.add('selected');
                    oneOn = true;
                }  
            } else {
                tab.tabbutton.classList.remove('selected');
                tab.tabitem.style.display = 'none';
            }
        }
        if (this.placeHolder)
            this.placeHolder.style.display = oneOn?'none':'';
        
        if (this.placeHolder && this.placeHolder.style.display === '' )
            this.selectedItem = null;
        else
            this.selectedItem = target;
    }

    onTabClicked(e) {
        let target = getAncestorByTagOrClassName(e.target, 'close-button');
        if (target) {
            if (target.USER_DATA) {
                if (target.USER_DATA.tabbutton === this.selectedItem) {
                    this.destroyTab(target.USER_DATA);
                    return;
                }
            }
        }
        target = getAncestorByTagOrClassName(e.target, 'tab-button');
        if (target !== null) {
            this.select(target);
        }
    }

    destroyTab(target) {
        if (target) {
            let index = -1;
            for(let i = 0; i < this.tabs.length;i++) {
                let tab = this.tabs[i];
                if (tab === target) {
                    index = i;
                    break;
                }
            }

            if (window[this.onCloseTab] instanceof Function) {
                if (window[this.onCloseTab](target) !== true) {
                    return;
                }
            }

            target.tabbutton.remove();
            target.tabitem.remove();
            if (index != -1)
                this.tabs.splice(index, 1);
            // if (index >= this.tabs.length)
            //     index = this.tabs.length-1;
            // this.select(index, true);
            this.select(null);
        }
    }
}

customElements.define('ux-tabview', UXTabView);


/********************************************************************************
 * 
 * UX-SPLITPANE
 * 
 *******************************************************************************/

const SPLIT_BAR_SIZE = 4;

class UXSplitPane extends HTMLElement {
     constructor() {
        super();
        this.classList.add('ux-splitpane');
        this.isVertical = toBoolean(this.getAttribute('orientation')=='vertical');
        this.size = toFloat(this.getAttribute('size'), 0.25);
        this.relativeToEnd = (this.size < 0)?true:false;
        this.isFractional = ((this.size >= -0.98 && this.size < 0) 
                            || (this.size > 0 && this.size <= 0.98))?true:false;
        this.isSizeable = this.getAttribute('sizeable')!=undefined?toBoolean(this.getAttribute('sizeable')):true;
        this.sides = [];
        this.minMax = {minA:null, minB:null, maxA:null, maxB: null};
        
        this.splitterBar = createElement('splitter-bar');
        this.dragBinder = this.onMouseDrag.bind(this);
        
        this.splitterBar.classList.add((this.isVertical?'vertical':'horizontal'));
        this.hideLeft = null;
       
        if (this.isSizeable) {
            this.splitterBar.addEventListener('mousedown', this.onMouseDown.bind(this));
            this.splitterBar.addEventListener('touchstart', this.onMouseDown.bind(this));
            this.splitterBar.style.cursor = this.isVertical?'ns-resize':'ew-resize';
        }
        this.dragHints = {};
        resizeObserver.observe(this);
     }

     onResize(contentRect) { 
        this.setBar(this.size);
    }

    getSide() {
        switch (this.hideLeft) {
            case true:
                return 'left';
            case false:
                return 'right';
            default:
                return 'all';
        }
    }
    hideSide(side) {
        if (side === 'left') {
            this.splitterBar.style.display = 'none';
            this.sides[0].elm.style.display = 'none';
            this.sides[1].elm.style.display = '';
            this.hideLeft = true;
        } else if (side === 'right') {
            this.splitterBar.style.display = 'none';
            this.sides[0].elm.style.display = '';
            this.sides[1].elm.style.display = 'none';
            this.hideLeft = false;
        } else {
            this.splitterBar.style.display = '';
            this.sides[0].elm.style.display = '';
            this.sides[1].elm.style.display = '';
            this.hideLeft = null;
        }
        this.setBar(this.size);
        return this.getSide();
    }

    connectedCallback() {
        let rem = [];
        for(let nd of this.childNodes) {
            if (nd instanceof HTMLElement) {
                if (this.sides.length < 2) {
                    let style = window.getComputedStyle(nd);
                    let xs = sumOfStyles(style, ['margin-left', 'margin-right', 'padding-right', 'padding-left', 'border-left-width', 'border-right-width']);
                    let ys = sumOfStyles(style, ['margin-top', 'margin-bottom', 'padding-top', 'padding-bottom', 'border-top-width', 'border-bottom-width']);

                    this.sides.push({elm:nd, xs:xs, ys:ys});
                    let min = getAttribute(nd, 'min', null);
                    let max = getAttribute(nd, 'max', null);
                    if (min != null) min = toInteger(min);
                    if (max != null) max = toInteger(max);
                    if (min != null && max != null) {
                        if (min > max) {
                            let t = min;
                            min = max;
                            max = t;
                        }
                    }
                    if (this.sides.length == 1) {
                        this.minMax.minA = min;
                        this.minMax.maxA = max;
                    } else {
                        this.minMax.minB = min;
                        this.minMax.maxB = max;
                    }
                } else
                    rem.push(nd);
            }
        }
        
        for(let nd of rem) {
            this.removeChild(nd);
        }
        rem = [];

        if (this.sides.length != 2) {
            throw('There must be 2 and only 2 Child HTMLElements for Split Panes');
        }

        this.appendChild(this.splitterBar);
        this.setBar(this.size);
    }

    onMouseDrag(e) {
        e.cancelBubble = true;
        e.preventDefault();
        if (e.type == 'mouseup') {
            window.removeEventListener('mousemove', this.dragBinder);
            window.removeEventListener('mouseup', this.dragBinder);
        } else if (e.type === 'mousemove'){
            let r = this.getBoundingClientRect();
            let x = (e.x) - r.left-this.dragHints.x;
            let y = (e.y) - r.top-this.dragHints.y;
            this.moveBar(x, y);
        } else if (e.type === 'touchend') {
            window.removeEventListener('touchmove', this.dragBinder);
            window.removeEventListener('touchend', this.dragBinder);
        } else if (e.type === 'touchmove') {
            let r = this.getBoundingClientRect();
            let x = (e.changedTouches[0].pageX) - r.left-this.dragHints.x;
            let y = (e.changedTouches[0].pageY) - r.top-this.dragHints.y;
            this.moveBar(x, y);
        }
    }

    onMouseDown(e) {
        if (e.type === 'touchstart') {
            window.addEventListener('touchmove', this.dragBinder);
            window.addEventListener('touchend', this.dragBinder);
            let r = this.splitterBar.getBoundingClientRect();
            this.dragHints.x = e.changedTouches[0].pageX-r.left;
            this.dragHints.y = e.changedTouches[0].pageY-r.top;
        } else if (e.which === 1) {
            let r = this.splitterBar.getBoundingClientRect();
            this.dragHints.x = e.x-r.left;
            this.dragHints.y = e.y-r.top;
            window.addEventListener('mousemove', this.dragBinder);
            window.addEventListener('mouseup', this.dragBinder);
        }    
    }

    moveBar(x, y, set) {
        if (this.wait === true) return;
        this.wait = true;
        if (this.isVertical === true) {
            if (y < 0) y = 0;
            if (y > this.offsetHeight) y = this.offsetHeight;
            x = 0;
        } else {
            if (x < 0) x = 0;
            if (x > this.offsetWidth) x = this.offsetWidth;
            y = 0;
        }
        
            let s0 = this.isVertical?y:x;
            let s1 = this.isVertical?(this.offsetHeight-y):(this.offsetWidth-x);

            let rSize = this.relativeToEnd?s1:s0;
            let rEdge = (this.isVertical?this.offsetHeight:this.offsetWidth);
            let vert = this.isVertical?y:x;
            let size = 0;
            if (this.isFractional) {
                size = rSize/rEdge;
                if (this.relativeToEnd)
                    size *= -1;
            } else {
                if (this.relativeToEnd)
                    size = rEdge-vert;   
                else 
                    size = rSize;
            }
            this.size = size;
            this.setBar(size);
            this.wait = false;
    }
    setBar(size) {
        
        if (this.hideLeft == true) {
            this.sides[1].elm.style.left = '';
            this.sides[1].elm.style.top = '';
            this.sides[1].elm.style.width = '100%';
            this.sides[1].style.height = '100%';   
        } else if (this.hideLeft == false) {
            this.sides[0].elm.style.left = '';
            this.sides[0].elm.style.top = '';
            this.sides[0].elm.style.width = '100%';
            this.sides[0].elm.style.height = '100%';   
        } else {
           
            let l = '0';
            let t = '0';
           
            let w = SPLIT_BAR_SIZE;
            let h = SPLIT_BAR_SIZE;

            let tw = this.offsetWidth;
            let th = this.offsetHeight;

            let ts = (this.isVertical?th:tw);
            size = Math.abs(size);

            if (this.isFractional) {
                if (this.relativeToEnd === true) {
                    if (this.isVertical) {
                        t = (1.0-size)*100 + '%';
                    } else {
                        l = (1.0-size)*100 + '%';
                    }
                } else {
                    if (this.isVertical) {
                        t = size*100 + '%';
                    } else {
                        l = size*100 + '%';
                    }
                }
            } else {
                if (this.relativeToEnd === true) {
                    if (this.isVertical) {
                        t = th - size;
                    } else {
                        l = tw - size;
                    }
                } else {
                    if (this.isVertical) {
                        t = size;
                    } else {
                        l = size;
                    }
                }
                t=t+'px';
                l=l+'px';
            }
            if (this.isVertical === false) {
                h = th;
                w*=2;
            } else {
                w = tw;
                h*=2;
            }
            
            this.splitterBar.style.left = l;
            this.splitterBar.style.top = t;
            this.splitterBar.style.width = w  + 'px';
            this.splitterBar.style.height = h  + 'px';

            let rect = this.splitterBar.getBoundingClientRect();
            let tRect = this.getBoundingClientRect();
            
            /*
            *  MIN/MAX Constraints: provides a way to restrict sizing of either side
            *      When both sides constraint with a [min and max] value, the first min/max's 
            *      will be overridden by the second.
            * 
            *      For best results, set min and/or max on only 1 side
            */

            let sa = (this.isVertical?rect.y-tRect.y:rect.x-tRect.x);
            let sb = (this.isVertical?tRect.bottom - rect.bottom:tRect.right - rect.right);
            if (this.minMax.minA !== null && sa < this.minMax.minA)
                this.splitterBar.style[this.isVertical?'top':'left'] = this.minMax.minA - SPLIT_BAR_SIZE + 'px';
            if (this.minMax.maxA !== null && sa > this.minMax.maxA)
                this.splitterBar.style[this.isVertical?'top':'left'] = this.minMax.maxA - SPLIT_BAR_SIZE + 'px';
            
            if (this.minMax.minB !== null && sb < this.minMax.minB) 
                this.splitterBar.style[this.isVertical?'top':'left'] = tRect.height - (this.minMax.minB + SPLIT_BAR_SIZE*2) + 'px';
            if (this.minMax.maxB !== null && sb > this.minMax.maxB)
                this.splitterBar.style[this.isVertical?'top':'left'] = tRect.height - (this.minMax.maxB + SPLIT_BAR_SIZE*2) + 'px';

            rect = this.splitterBar.getBoundingClientRect();

            tw=tRect.width-(SPLIT_BAR_SIZE*2);
            th=tRect.height-(SPLIT_BAR_SIZE*2);

            if ((rect.x-tRect.x) > tw) 
                this.splitterBar.style.left = tw + 'px';

            if ((rect.x-tRect.x) < 0)
                this.splitterBar.style.left = 0 + 'px';

            if ((rect.y-tRect.y) > th)
                this.splitterBar.style.top = th + 'px';
        
            if (rect.y < 0) 
                this.splitterBar.style.top = 0 + 'px';

            rect = this.splitterBar.getBoundingClientRect();
            this.sides[0].elm.style.left = 0 + 'px';
            this.sides[0].elm.style.top = 0 + 'px';
            this.sides[1].elm.style.right = 0 + 'px';
            this.sides[1].elm.style.bottom = 0 + 'px';

            
            if (this.isVertical) {
                this.sides[0].elm.style.width = (tRect.width) - this.sides[0].xs + 'px';
                this.sides[0].elm.style.height = (rect.y - tRect.y) - this.sides[0].ys + 'px';
                this.sides[1].elm.style.width = (tRect.width) - this.sides[1].xs + 'px';
                this.sides[1].elm.style.height = (tRect.bottom - rect.bottom) - this.sides[1].ys + 'px';
            } else {
                this.sides[0].elm.style.width = (rect.x - tRect.x) - this.sides[0].xs + 'px';
                this.sides[0].elm.style.height = (tRect.height) - this.sides[0].ys + 'px';
                this.sides[1].elm.style.width = (tRect.right - rect.right) - this.sides[1].xs + 'px';
                this.sides[1].elm.style.height = (tRect.height) - this.sides[1].ys + 'px'; 
            }
        }    
    }
 }

 customElements.define('ux-splitpane', UXSplitPane);
 
 class UXMenuItem extends HTMLElement {
    static get observedAttributes() { return ['label']; } 
    constructor(forAdoption) {
        super();
        this.moreButton = null;
        this.label = document.createElement('label');
        this.connected = false;
        this.popup = null;
        this.forAdoption = forAdoption;
    }

    connectedCallback() {
        if (this.parentNode && this.parentNode.tagName !== 'UX-MENU')
            throw "UXMenuItems must be child of UXMenu";           

        removeNonNodeChildren(this);
        
        if (this.connected === true)
            return;
   
        if (this.forAdoption !== true) {
            if (this.children.length > 0) {
                this.popup = new UXMenu(this);
                this.popup.style.display = 'none';
                document.body.append(this.popup);
                this.moreButton = document.createElement('div');
                this.moreButton.innerText = this.parentNode.isPopupMenu()?'\u25b8':'\u25be';
                this.moreButton.className = 'more-button';
            }
            
        }  else {
            this.popup = new UXMenu(this);
            document.body.append(this.popup);
        }
        this.appendChild(this.label);
        
        if (this.moreButton)
            this.appendChild(this.moreButton);
        this.connected = true;
        
    }
    
    getPopup() {
        return this.popup;
    }

    getOwner() {
        return this.parentNode;
    }

    triggerPopup() {
        if (this.popup) {
            this.popup.show();
            return true;
        } else {
            return false;
        }
    }

    isOwnerAPopupWindow() {
        if (this.parentNode instanceof UXMenu) {

            return this.parentNode.isPopupMenu();
        } else {
            return false;
        }
    }
    getText() {
        return this.label.innerText;
    }
    attributeChangedCallback(name, oldValue, newValue) { 
        switch(name) {
            case 'label':
                if (typeof(newValue) === 'string') {
                    if (newValue === '-') {
                        this.label.innerText = '';
                        this.classList.remove('menu-item');
                        this.classList.add('border-etched');

                    } else {
                        this.label.innerText = newValue;
                        this.classList.add('menu-item');
                        this.classList.remove('border-etched');
                    }
                }
                break;
        }
    }
}

function createOverFlowmanager(target, vert) {
    let obj = {};
    obj.ellipse = new UXMenuItem(true);
        obj.ellipse.classList.add('overflow-button');
        obj.ellipse.setAttribute('label', '\u22ee');
        target.appendChild(obj.ellipse);
    obj.managed = target;
    obj.observables = [];
    obj.isVertical = (vert===true || vert === 'true' || vert === 'vertical');
    obj.updateObservables = function() {
        if (this.observables.length == 0) {
            for(let child of this.managed.children) {
                if (child != this.ellipse) {
                    let obj = {
                        node:child,
                        size:getElementSize(child)
                    };
            
                    this.observables.push(obj);
                }
            }
        }
    }

    obj.setVertical = function(b) {
        this.isVertical = (b===true || b === 'true' || b === 'vertical');
        this.onResize(this.managed.getBoundingClientRect());
    }
    
    obj.onResize = function(contentRect) {
        if (this.observables.length === 0)
            this.updateObservables();

        let er = this.ellipse.getBoundingClientRect();
        let maxSize = this.isVertical?(contentRect.height - er.height):(contentRect.width - er.width);
        let cumulativeSize = 0;

        for(let item of this.observables) {
            if (item.node.parentNode != this.managed) {
                item.node.remove();
                this.managed.insertBefore(item.node, this.ellipse);
            }
        }

        // place those which would overflow the container onto the popup-menu
        let hiddingSome = 'none';
        for(let item of this.observables) {
            let s = this.isVertical?item.size.height:item.size.width;
            if ((cumulativeSize+=s) > maxSize) {
                hiddingSome = '';
                this.managed.removeChild(item.node);
                obj.ellipse.getPopup().appendChild(item.node);
            }
        }
        obj.ellipse.getPopup().style.display = 'none';
        this.ellipse.style.display = hiddingSome;
    }

    resizeObserver.observe(target);

    return obj;
}

function createNonMenuItem(elm) {
    let container = document.createElement('div');
        container.className = 'non-menuitem';
    let text = elm.getAttribute('label');
    if (typeof(text) === 'string') {    
        let label = document.createElement('label');
            label.innerText = text;
            label.className = 'title';
            container.appendChild(label); 
    }
    container.appendChild(elm);
    return container;
}

class UXMenu extends HTMLElement {
    static get observedAttributes() { return ['orientation']; } 
    constructor(owner) {
        super();
        this.className = 'menubar';
        this.owner = owner;
        this.connected = false;
        this.isPopup = false;
        this.tabIndex = -1;
        this.addEventListener('click', this.onEvent.bind(this));
        this.addEventListener('scroll', this.onEvent.bind(this));
        this.addEventListener('keydown', this.onEvent.bind(this));
        this.isVertical = false;
        
        this.opensLeft = false;
        this.overFlowManager = 'hello';
        if (owner instanceof HTMLElement) {
            if (owner.tagName === 'UX-MENUITEM') {
                this.className = 'popupmenu';
                while(owner.firstChild) {
                    let child = owner.firstChild;
                    child.remove();
                    if (child.tagName !== 'UX-MENUITEM') {
                        let c = createNonMenuItem(child);
                        this.appendChild(c);
                        c.addEventListener('onmessage', this.onMessage.bind(this));
                    } else {
                        this.appendChild(child);
                    }
                }
                this.isPopup = true;
                this.addEventListener('focusout', this.onEvent.bind(this));
            } else {
                throw 'Owner of UXMenu must be "null" or a "MenuItem"';
            }
        } 
    }

    attributeChangedCallback(name, oldValue, newValue) { 
        switch(name) {
            case 'orientation':
                this.isVertical = (newValue === 'vertical'?true:false);
            break;
        }
    }
    onResize(contentRect) {
        this.overFlowManager.onResize(contentRect);
        
    }

    connectedCallback() { 
       // if (this.connected) return;

        removeNonNodeChildren(this);
        
        if (!this.owner && this.getAttribute('overflow') === 'managed') {
           customElements.whenDefined('ux-menuitem').then(() => {
                this.overFlowManager = createOverFlowmanager(this, this.getAttribute('orientation'));
            });
        }
        
        this.connected = true;
    }
    
    onMoreClicked(popup) {
        popup.show();
    }

    isPopupMenu() {
        return this.isPopup;
    }

    closeAll() {
        if (this.owner) {
            if (this.owner.parentNode instanceof UXMenu) {
                this.owner.parentNode.closeAll();
            } 
        } else {
            this.close(null);
        }
    }

    close(ignore) {
        if (!ignore && this.isPopupMenu()) {
            this.style.display = 'none';
            this.owner.classList.remove('selected');
        }
        for(let child of this.children) {
            if (child instanceof UXMenuItem && child.getPopup() !== ignore) {
                if (child.getPopup() && child.getPopup().style.display === '') {
                    child.getPopup().close();
                }                    
            }
        } 
        if (ignore) {
            ignore.focus();
        }
    }

    show() {
        
        if (this.isPopup) {
            
            if (this.style.display === '') {
                this.close();
                return;
            }
            this.owner.parentNode.close(this);

            this.style.display = '';
            this.style.height = '';

            let fromPopup = this.owner.isOwnerAPopupWindow();
            if (this.owner.parentNode.isVertical) fromPopup = true;
            let tRect = this.getBoundingClientRect();
            let oRect = this.owner.getBoundingClientRect();

            let oh = tRect.height;

            let h = window.innerHeight - oRect.height;
            let w = window.innerWidth - 10;
            
            let x = fromPopup?oRect.right:oRect.left;
            let y = fromPopup?oRect.top:oRect.bottom;

            this.opensLeft = false;

            if (this.owner.parentNode instanceof UXMenu) {
                this.opensLeft = this.owner.parentNode.opensLeft;
                if (this.owner.parentNode.opensLeft === true) {
                    x = oRect.left - tRect.width;
                    y = oRect.bottom;
                }
            }

            let aboveY = oRect.top;
            let belowY = h - oRect.bottom;

            let above = (aboveY > belowY);
            let maxH = Math.max(aboveY, belowY) - 20;
            
        // deal with y overflows
            if (oh > maxH) {
                oh = maxH;
            }
            oh = Math.min(oh, h*0.75);
            this.style.height = oh + 'px'
            
            if (oh > belowY) {
                if (this.opensLeft === true || this.owner.parentNode.isPopupMenu()) 
                    y = oRect.bottom - oh;
                else
                    y = oRect.top - oh;
            }
        // deal with x overflows;
            if (x + tRect.width >= w) {
            
                    x = (this.owner.parentNode.isPopupMenu()?oRect.left:oRect.right) - tRect.width;
                    this.opensLeft = true;
                }
            if (x < 0) x = 0;
            
            this.style.left = x + 'px';
            this.style.top = y + 'px';
            this.focus();
            this.autoSelect(false);
        }
    }

    highlightTarget(target) {
        if (this.previousTarget) {
            this.previousTarget.classList.remove('selected');
        }
        if (target instanceof UXMenuItem) {
            target.classList.add('selected');
            this.previousTarget = target;
        }
    }

    onEvent(e) {
        if (e.type === 'focusout') {
            let target = getAncesotryByType(e.relatedTarget, UXMenu);
            if(target instanceof UXMenu) {
                this.close(e.relatedTarget);
            } else {
                this.closeAll();
            }
        } else if (e.type === 'click') {
            let target = getAncesotryByType(e.target, UXMenuItem);
            if (target) {
                this.selectTarget(target);
            } else {
                target = getAncesotryByType(e.target, UXMenu);
                //this.closeAll();
            }
        } else if (e.type === 'scroll') {
            this.close(this);
        } else if (e.type === 'keydown') {
            e.preventDefault();
            if (this.owner !== undefined) {
                switch (e.keyCode) {
                    case 13:    // enter
                        this.selectTarget(null, null, true);
                        break;
                    case 27:    // escape
                        this.focusRoot();
                        break;
                    case 37:    // left
                        this.focusRoot();
                        break;
                    case 38:    // up
                        this.goPrevious();
                        this.ensureVisible();
                        break;
                    case 39:    // right
                        this.selectTarget(null, false, true);
                        break;
                    case 40:    // down
                        this.goNext();
                        this.ensureVisible();
                        break;
                }
            } else {
                // console.log(e.keyCode, this.owner);
            
                switch (e.keyCode) {
                    case 13:    // enter
                        this.selectTarget(null, null, true);
                        break;
                    case 27:    // escape
                        this.focusRoot();
                        break;
                    case 37:    // left
                        this.goPrevious();
                        this.ensureVisible();                        
                        break;
                    case 39:    // right
                        this.goNext();
                        this.ensureVisible();
                        break;
                    case 40:    // down
                        this.selectTarget(null, false, true);                       
                        break;
                }
            }
        }
    }

    goNext() {
        let target = this.previousTarget?this.previousTarget.nextSibling:this.firstChild;
        while(target) {
            if (target instanceof UXMenuItem && target.getText() != '') {
                this.highlightTarget(target);
                break;
            }
            target = target.nextSibling;
        }
        
    }

    goPrevious() {
        let target = this.previousTarget?this.previousTarget.previousSibling:this.lastChild;
        while(target) {
            if (target instanceof UXMenuItem && target.getText() != '') {
                this.highlightTarget(target);
                break;
            }
            target = target.previousSibling;
        }
        
    }
    
    ensureVisible() {
        if (this.previousTarget instanceof HTMLElement) {
            let y0 = this.scrollTop;
            let tr = this.getBoundingClientRect();
            let cr = this.previousTarget.getBoundingClientRect();
            let t0 = cr.top - tr.top-8;
            let t1 = t0 + cr.height;
            let h = this.offsetHeight-8;
            if (t0 <= 0) {
                this.scrollTop = (t0+y0)+2;
            } else if (t1>=h) {
                this.scrollTop = t1-h+y0+8;
            }
        }
    }

    focusRoot() {
        if (this.owner && this.owner.parentNode instanceof UXMenu) {
            this.owner.parentNode.close(this.owner.parentNode);
            this.owner.parentNode.highlightTarget(this.owner.parentNode.previousTarget);
        }
    }

    autoSelect(autoNext) {
        if (this.previousTarget) {
            this.highlightTarget(this.previousTarget);
        } else if (autoNext === true) {
            this.goNext();
        }
        this.ensureVisible();

    }

    selectTarget(target, close, autoselect) {
        target = !target?this.previousTarget:target;
        if (target) {
            this.highlightTarget(target);
            if(!target.triggerPopup() && close !== false) {
                this.closeAll();
            }
            if (autoselect === true && target.getPopup()) {
                target.getPopup().autoSelect(true);
            }
        }
    }    

    onMessage(e) {
        e.cancelBubble = true;
        switch (e.detail.msg) {
            case "close":
                this.closeAll();
                break;
        }
        console.log(e);
    }
}

customElements.define('ux-menu', UXMenu);
customElements.define('ux-menuitem', UXMenuItem);
const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WENDSDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

/********************************************************************************
 *
 * GANTT (hourly) 
 *
 ********************************************************************************/
function timePad(n) {
   
    if (!(typeof(n)==='number')) {
        n = 0;
    } else {
        n = Math.floor(n);
    }
    let pad = 0;
    if (n === 0) pad= 2;
    if (n < 10) pad = 1; 
    
    return ('0').repeat(pad) + (n);
}

function timeString(h, m) {
    return (timePad(h) + ':' + timePad(m));
}

class UXGantt extends HTMLElement {

    constructor() {
        super();
        this.classList.add('gantt');

        this.connected = false;
        this.timeLineWrapper = document.createElement('div');
            this.timeLineWrapper.classList = 'timeline-wrapper'

        this.ganttGroupContainer = document.createElement('div');
            this.ganttGroupContainer.className = 'gantt-group-container';

        this.timeLineScroll = document.createElement('div');
            this.timeLineScroll.className = 'timeline-scroll';
            this.timeLineWrapper.appendChild(this.timeLineScroll);
        
        this.timeButtonPrefered = document.createElement('div');
            this.timeButtonPrefered.innerHTML = '\u2606';
            this.timeButtonPrefered.style.flex='none';
            this.timeButtonPrefered.classList = 'gantt-etched home';
            this.timeLineScroll.appendChild(this.timeButtonPrefered);
            this.timeButtonPrefered.addEventListener('click', this.onTimeChangeButtonClicked.bind(this));

        this.timeButtonLess = document.createElement('div');
            this.timeButtonLess.innerHTML = '\u25C0';
            this.timeLineScroll.appendChild(this.timeButtonLess);
            this.timeButtonLess.classList = 'gantt-etched';
            this.timeButtonLess.addEventListener('click', this.onTimeChangeButtonClicked.bind(this));
            
        this.timeButtonMore = document.createElement('div');
            this.timeButtonMore.innerHTML = '\u25B6';
            this.timeButtonMore.classList = 'gantt-etched';
            this.timeLineScroll.appendChild(this.timeButtonMore);
            this.timeButtonMore.addEventListener('click', this.onTimeChangeButtonClicked.bind(this));
        
        this.timeLineScale = document.createElement('div');
            this.timeLineScale.className = 'timeline-scale';
            this.timeLineWrapper.appendChild(this.timeLineScale);
        this.timeLinePadding = document.createElement('div');
            this.timeLinePadding.classList = 'scroll-bar-padder gantt-etched';
            this.timeLineWrapper.appendChild(this.timeLinePadding);

        this.em = parseFloat(getComputedStyle(this).fontSize);
        
        this.timeScale = {
            width:100,
            targetCount:11,
            actualCount:0,
            timeStart:8,
            preferedStartTime: 8,
            minWidth:(this.em*5),
            gutterWidth:(this.em*6)
        }

        this.columnGridLines = [];

        for(let i = 0; i < 24; i++) { 
            let target = this.addTimeHeader(timeString(i), (i<8||i>18)); 
            let gridLine = document.createElement('div');
                gridLine.className = 'gantt-vertical-line';
                this.appendChild(gridLine);
                this.columnGridLines.push(gridLine);
                target.ASSOCIATED_ELEMENT = gridLine;
                target.addEventListener('click', this.onTimeHeaderClicked.bind(this));
        }

        this.ganttGroupContainer.addEventListener('scroll', this.onGanttGroupContainerScroll.bind(this));
    }

    onGanttGroupContainerScroll(e) {
        for(let child of this.ganttGroupContainer.children) {
            if (child.tagName === 'UX-GANTT-GROUP') {
                child.fixScroll();
            }
        }
    }
    connectedCallback() {


        if (this.connected === true) {
            return;
        }
        let expanded = this.getAttribute('expanded');
        for(let i = this.children.length-1;i>=0;i--) {
            let child = this.children[i];
            if (child.tagName === 'UX-GANTT-GROUP') {
                child.remove();
                this.ganttGroupContainer.prepend(child);
                child.setAttribute('expanded', expanded);
            }
        }

        this.appendChild(this.timeLineWrapper);
        this.appendChild(this.ganttGroupContainer);
       
        resizeObserver.observe(this);
        this.connected = true;
    }

    addTimeHeader(text, offhours) {
        let elm = document.createElement('div');
            elm.className = 'time-header gantt-etched';
        let label = document.createElement('label');
            elm.appendChild(label);
            label.innerText = text;
        if (offhours) elm.classList.add('offhours');
        this.timeLineScale.appendChild(elm);
        return elm;
    }

    onResize(contentRect) {
        let cw = this.ganttGroupContainer.clientWidth;
        let ow = this.ganttGroupContainer.offsetWidth;
        let dif = (ow - cw);
        this.timeLinePadding.style.width = dif-2 + 'px';
        this.timeLinePadding.style.display = ow != cw?'':'none';
        
        
        this.timeLineScroll.style.width = this.timeScale.gutterWidth + 'px';
        this.ganttGroupContainer.style.top = this.timeLineWrapper.offsetHeight + 'px';
        this.updateTimeScale();
        if (contentRect !== false)
            this.updateGanttGroups();
    }

    updateGanttGroups() {
        
        for(let child of this.ganttGroupContainer.children) {
            if (child.tagName === 'UX-GANTT-GROUP') {
                child.update(this.timeScale.gutterWidth);
            }
        }
    }

    onTimeChangeButtonClicked(e) {
        if (e.currentTarget===this.timeButtonPrefered) {
            this.setTimeStart(this.timeScale.preferedStartTime);
        } else {
            this.incrementTimeChange(e.currentTarget===this.timeButtonLess?-1:1);
        }
    }

    incrementTimeChange(inc) {
        this.setTimeStart(this.timeScale.timeStart + inc);
    }

    setTimeStart(newStartTime) {
        if (!(typeof(newStartTime)==='number'))
            return;
        let start = Math.floor(newStartTime);
        if (start >= this.timeLineScale.children.length)
            start = this.timeLineScale.children.length-1;
        if(start < 0) start = 0;
        this.timeScale.timeStart = start;
        this.updateTimeScale();
    }

    updateTimeScale() {
        let hw = this.calcTimeScaleColumnWidths();
        let x = 0;
        
        let start = this.timeScale.timeStart;
        let len =  this.timeScale.actualCount;
        let end = start + len;
        let max = this.timeLineScale.children.length-1;
        let gx = this.timeScale.gutterWidth;
        if (end > max) {
            end = max;
            start = end - len;
        }
        if (start === this.timeScale.preferedStartTime) {
            this.timeButtonPrefered.classList.add('onpoint');
        } else {
            this.timeButtonPrefered.classList.remove('onpoint');
        }
        
        for(let i = 0; i < this.timeLineScale.children.length; i++) {
            let child = this.timeLineScale.children[i];
            if (i < start || i >= end) {
                this.columnGridLines[i].style.display = 'none';
                child.style.display = 'none';
                continue;
            } else {
                this.columnGridLines[i].style.display = '';
                child.style.display = '';
            }
            this.columnGridLines[i].style.left = gx + x + 'px';
            this.columnGridLines[i].style.width = (hw-1) + 'px';

            child.style.left = x + 'px';
            child.style.width = (hw-2) + 'px';
            x+=hw;
        }
    }

    onTimeHeaderClicked(e) {
        let target = e.currentTarget;
        if (e.currentTarget.ASSOCIATED_ELEMENT) {
            e.currentTarget.ASSOCIATED_ELEMENT.classList.toggle('selected');
        }
    }

    calcTimeScaleColumnWidths() {
        let w = this.timeLineScale.getBoundingClientRect().width;
        
        let cw = w/this.timeScale.targetCount;
        if (cw < this.timeScale.minWidth) {
            let tc = Math.floor(w/this.timeScale.minWidth);
            cw = w/tc;
            this.timeScale.actualCount = tc
        } else {
            this.timeScale.actualCount = this.timeScale.targetCount;
        }
        this.timeScale.width = cw;
        return cw;       
    }

    attributeChangedCallback(name, oldValue, newValue) { 
        switch(name) {
            case 'expanded':
                this.expandChildren(newValue);
                break;
        }
    }

    expandChildren(newValue) {
        for(let c of this.ganttGroupContainer.children) {
            c.setAttribute('expanded', newValue);
        }
    }

    appendChild(newChild) {
        if (newChild instanceof UXGanttGroup) {

            if (! newChild.getAttribute('groupid')) {
                return "Groups need a 'groupid'";
            }
            let groupid = newChild.getAttribute('groupid').toLowerCase();

            for(let child of this.ganttGroupContainer.children) {
                if (child instanceof UXGanttGroup) {
                    if (child.getAttribute('groupid').toLowerCase() == groupid) {
                        return 'This gantgroup already exists.';
                    }
                }
            }
            if (newChild.parentNode)
                return "This group already has a parent.";
            this.ganttGroupContainer.appendChild(newChild);
            this.onResize();
            return 'Added new group';
        } else {
            super.appendChild(newChild);
        }
    }
}

/********************************************************************************
 *
 * GANTT ROW ITEM 
 *
 ********************************************************************************/
class UXGanttRowItem extends HTMLElement {
    static get observedAttributes() { return ['label'] };
    constructor(label)  {
        super();
        this.classList.add('gantt-row-item');
        this.connected = false;
        this.rowItemContainer = document.createElement('div');
            this.rowItemContainer.className = 'gantt-row-content-container';
        this.rowItemLabel = document.createElement('div');
            this.rowItemLabel.className = 'gantt-row-item-label gantt-etched';
        this.label = document.createElement('label');
            this.rowItemLabel.appendChild(this.label);

        if (label != null)
            this.setAttribute('label', label);


        this.rowItemLabel.addEventListener('click', this.onRowItemLabelClicked.bind(this));
    }

    onRowItemLabelClicked(e) {
        this.classList.toggle('select');
    }

    connectedCallback() {
        if (this.connected===true) return

        this.appendChild(this.rowItemLabel);
        this.appendChild(this.rowItemContainer);
        this.connected = true;
    }

    attributeChangedCallback(name, oldValue, newValue) { 
        switch(name) {
            case 'label':
                if (typeof(newValue) === 'string') 
                    this.label.innerText = newValue;
                break;
        }
    }

    update(gutterWidth) {
        this.rowItemLabel.style.width = gutterWidth + 'px';
    }
}


/********************************************************************************
 *
 * GANTT GROUP 
 *
 ********************************************************************************/
class UXGanttGroup extends HTMLElement {
    static get observedAttributes() { return ['label', 'expanded']; } 
    constructor(groupid, label) {
        super();
        this.classList.add('gantt-group');
        this.connected = false;
        this.ganttGroupWrapper = document.createElement('div');
            this.ganttGroupWrapper.className = 'gantt-group-wrapper';
        this.groupTitleBar = document.createElement('div');
            this.groupTitleBar.className = 'gantt-group-titlebar gantt-etched';
        this.label = document.createElement('label');
            this.groupTitleBar.appendChild(this.label);
        this.groupTitleBar.addEventListener('click', this.onToggle.bind(this));
        this.gantt = null;
        if (typeof(groupid) === 'string') {
            this.setAttribute('groupid', groupid);
        }
        if (typeof(label) === 'string') {
            this.setAttribute('label', label);
        }
    }

    connectedCallback() {
        if (this.connected) return;
        this.gantt = this.parentNode;
        this.appendChild(this.groupTitleBar);
        this.appendChild(this.ganttGroupWrapper);
        
        for(let day of DAY_NAMES) {
            let item = new UXGanttRowItem(day);
            
            this.ganttGroupWrapper.appendChild(item);
        }
        // GanttCongruency.addGroup(this);
        this.connected = true;
    }

    disconnectedCallback() {
        //console.log('Custom GanttGroup element removed from page.');
        // UXGantt.removeGroup(this);GanttCongruency
    }


    onToggle(e) {
        console.log(e);
        if (e.detail === 2) {
            e.cancelBubble = true;
            e.preventDefault();
            this.remove();
            return;
        }
        this.setExpanded(this.ganttGroupWrapper.style.display !== '');
    }

    setExpanded(exp) {
        let oldClientWidth = this.parentNode.clientWidth;
          
        if (exp === true) {//this.ganttGroupWrapper.style.display === '') {
            this.ganttGroupWrapper.style.display = '';
        } else {
            this.ganttGroupWrapper.style.display = 'none';
        }

        if (oldClientWidth !== this.parentNode.clientWidth
            && this.gantt && this.gantt.onResize) {
            this.gantt.onResize(false);
        }
    }

    update(gutterWidth) {
        for(let child of this.ganttGroupWrapper.children) {
            if (child.tagName === 'UX-GANTT-ROW-ITEM')
                child.update(gutterWidth);
        }
    }

    fixScroll() {
        let p = this.parentNode;
        if (p) {
            
            let pr = p.getBoundingClientRect();
            let tr = this.ganttGroupWrapper.getBoundingClientRect();
            
            let th = this.groupTitleBar.offsetHeight;

            let tb = tr.bottom;
            let tt = tr.top;

            let pb = pr.bottom;
            let pt = pr.top;

            let oy = tt-pt;
            let dy = (th-oy);
            let tb2 = (tb-th);
            let tbk = pt-tb2
            if (tt < (pt+th) && tbk <= th) {  
                if (tbk >= 0 && tbk <= th) dy-=(tbk);
                this.groupTitleBar.classList.add('ensure-visible');
                this.groupTitleBar.style.top = dy + 'px';
                this.style.paddingTop = th + 'px';
            } else {
                this.groupTitleBar.classList.remove('ensure-visible');
                this.groupTitleBar.style.top = '';
                this.style.paddingTop = '';
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) { 
        switch(name) {
            case 'label':
                if (typeof(newValue) === 'string') {
                    this.label.innerText = newValue;
                }
                break;
            case 'expanded':
                this.setExpanded(newValue === 'true' || newValue === true);
            break;    
        }
    }    
}

customElements.define('ux-gantt-row-item', UXGanttRowItem);
customElements.define('ux-gantt-group', UXGanttGroup);
customElements.define('ux-gantt', UXGantt);
