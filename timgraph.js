const DAY_NAMES = [
    'MONDAY', 'TUESDAY', 'WENDSDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
]
const RESIZE_OBSERVER = new ResizeObserver( entries => {
    for (let entry of entries) {
        if (entry.target.onResize)
            entry.target.onResize(entry.contentRect);
    }
  });

function padString(str, ch, n) {
    
    if (typeof(n) !== 'number') n = 2;
    if (typeof(str) === 'number') str = str.toString();
    if (typeof (str) === 'string') {
        let l = n-str.length;
        if (l > 16) l = 16;
        if (l > 0) 
            str = ch.repeat(l) + str;
    }
    return str;
}

function timeString(... v) {
    let r = [];
    for(let i of v) {
        r.push(padString(i, '0'))
    }
    return r.join(':');
}

class UXWidget extends HTMLElement {
    constructor() {
        super();
        this.classList.add('ux-widget');
    }
    setOnResizeObserver() {
        RESIZE_OBSERVER.observe(this);
    }
    onResize(contentRect) {}
    update() {};
    onAction(action) {}
}

customElements.define('ux-widget', UXWidget);

class UXButton extends UXWidget {
    
    static get observedAttributes() {
        return ['label'];
    }
    
    constructor(label, parentNode, owner, command) {
        super();
        this.connected = false;
        this.classList.add('ux-button', 'border-raised');
        this.label = document.createElement('div');
            this.setAttribute('label', label);
        if (parentNode instanceof HTMLElement) {
            parentNode.appendChild(this);
        }

        if (command && owner instanceof UXWidget) {
            this.addEventListener('click', function() {
                owner.onAction(command, this);
            }.bind(owner));
        }
    }

    connectedCallback() {
        if (this.connected) return;
        while(this.firstChild)
            this.firstChild.remove();
        this.appendChild(this.label);
        this.connected = true;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (typeof(newValue) === 'string')
            this.label.innerText = newValue;
    }
}

customElements.define('ux-button', UXButton);

class UXSplash extends HTMLElement {
    constructor() {
        super();
        this.classList.add('ux-splash');
    }

    connectedCallback() {
        setTimeout(this.onTimeOut.bind(this), 1000);
    }

    onTimeOut() {
        this.remove();
        document.getElementById('workspace').style.display = '';
        delete this;

    }
}


customElements.define('ux-splash', UXSplash);

/*************************************************************************** 
 * 
 *  TIME GRAPH HEADER: includes a scale and position adjustment buttons
 *  to change the start time of the graph. The scale attempts to show
 *  10 hours (from 8:00 AM to 6 PM is the initial range), unless the 
 *  width for each button would be less than a threshold of 60 pixles 
 *  where it will show only those that will fit within the width of 
 *  the scale. Off-hours are shaded dark, that is times before 8:00 AM
 *  and hours after 6:00 PM.
 * 
 **************************************************************************/
class UXTimeGraphHeader extends UXWidget {
    constructor() {
        super();
        this.classList.add('ux-timegraph-header');
        this.connected = false;
        this.gutterBar = document.createElement('div');
            this.gutterBar.className = 'button-bar flex-none';
        this.btnHome = new UXButton('\u2302', this.gutterBar, this, 'home');
        this.btnLeft = new UXButton('\u25c0', this.gutterBar, this, 'left');
        this.btnRight = new UXButton('\u25b6', this.gutterBar, this, 'right');
        this.scrollBarPad = new UXButton('\u22ee');
            this.scrollBarPad.classList.add('flex-none', 'no-padding');
        this.scale = document.createElement('div');
            this.scale.className = 'button-bar scale flex-grow';
        for(let i = 0; i < 24; i++) {
            let btn = new UXButton(timeString(i, 0), this.scale, this, (i));
            if (i < 8 || i > 17) {
                btn.setAttribute('special', 'offhours');
            }
        }
        this.scale_options = {
            startTime:8,
            prefStartTime:8,
            visibleHours: 10,
            prefVisibleHours:10,
            minButtonWidth:60,
            buttonWidth:0
        }
    }

    connectedCallback() {
        if (this.connected) return;
        this.appendChild(this.gutterBar);
        this.appendChild(this.scale);
        this.appendChild(this.scrollBarPad);
        this.connected = true;
    }

    onResize(scrollbarWidth) {
        if (scrollbarWidth < 4) {
            this.scrollBarPad.style.display = 'none';
        } else {
            this.scrollBarPad.style.display = '';
            this.scrollBarPad.style.width = scrollbarWidth + 'px';
        }
        this.calculateScale();
        this.updateScale();
    }

    validateStartTime() {
        let s = this.scale_options.startTime;
        if (s < 0) s = 0;
        let m = 24-this.scale_options.visibleHours;
        if (s > m) s = m;
        this.scale_options.startTime = s;
    }

    updateScale() {
        this.validateStartTime();
        let f = this.scale_options.startTime;
        let l = f + this.scale_options.visibleHours;
        if (l > 23) {
            l = 23;
            f = l-this.scale_options.visibleHours;
        }
        if (this.scale_options.prefStartTime === this.scale_options.startTime) {
            this.btnHome.classList.add('home');
        } else {
            this.btnHome.classList.remove('home');
        }

        for(let i = 0; i < this.scale.children.length; i++) {
            let btn = this.scale.children[i];
            if (i >= f && i < l) {
                btn.style.display = '';
                btn.style.width = this.scale_options.buttonWidth + 'px';
            } else {
                btn.style.display = 'none';
            }
        }
    }

    calculateScale() {
        let scaleWidth = (this.scale.offsetWidth);
        let visHours = this.scale_options.prefVisibleHours;
        let buttonWidth = scaleWidth/(visHours);
        if (buttonWidth < this.scale_options.minButtonWidth) {
            visHours = Math.floor(scaleWidth/this.scale_options.minButtonWidth);
            buttonWidth = scaleWidth/visHours;
        }
        if (visHours <= 1) {
            visHours = 1;
            buttonWidth = scaleWidth;
        }
        this.scale_options.visibleHours = visHours;
        this.scale_options.buttonWidth = buttonWidth;
    }

    getGutterWidth() {
        return this.gutterBar.offsetWidth;
    }

    getStartTime() {
        return this.scale_options.startTime;
    }

    getEndTime() {
        return this.scale_options.startTime + this.scale_options.visibleHours;
    }

    getScaleWidth() {
        return this.scale_options.buttonWidth;
    }

    onAction(command, targetElm) {
        switch (command) {
            case 'home':
                this.scale_options.startTime =
                    this.scale_options.prefStartTime;
                break;
            case 'left':
                this.scale_options.startTime--;
                break;
            case 'right':
                this.scale_options.startTime++;
                break;
            default:
                if (command >= 0 && command <= 23) {
                    this.toggleHour(command);
                }
                return;
        }
        this.updateScale();
        if (this.parentNode instanceof UXWidget)
            this.parentNode.update();
    }

    toggleHour(h) {
        if (h >= 0 && h <= 23) {
            let btn = this.scale.children[h];
            btn.classList.toggle('selected');
            if (this.parentNode instanceof UXWidget)
                this.parentNode.update(h, btn.classList.contains('selected'));
        }
    }
}

/*************************************************************************** 
 *
 *  TIME GRAPH:  
 * 
 **************************************************************************/

class UXTimeGraph extends UXWidget {
     constructor() {
         super();
         this.classList.add('ux-timegraph');
         this.connected = false;
         this.content = document.createElement('div');
            this.content.className = 'content';
         this.timeGraphHeader = new UXTimeGraphHeader();
         this.gridLines = [];
         super.setOnResizeObserver();
         this.pause = false;
         this.content.addEventListener('scroll', this.onContentScroll.bind(this));
     }

     connectedCallback() {
        if (this.connected) return;
        while(this.firstChild) {
            this.firstChild.remove();
        }

        for(let i = 0; i < 24; i++) {
            let gridLine = document.createElement('div');
            gridLine.className = 'grid-line';
            this.appendChild(gridLine);
            this.gridLines.push(gridLine);
            if (i < 8 || i > 17) {
                gridLine.setAttribute('special', 'offhours');
            }
        }
        this.appendChild(this.timeGraphHeader);
        this.appendChild(this.content);
        this.connected = true;
     }

     onResize(contentRect) {
        if (this.pause) return;
        let scrollbarWidth = this.content.offsetWidth - this.content.clientWidth;
        this.timeGraphHeader.onResize(scrollbarWidth);
        this.update();
     }


     notifyGroups() {
        if (this.pause) return;
        for(let grp of this.content.children) {
            grp.onResize(this.timeGraphHeader.getGutterWidth()-1, true);
        }
    }

    onContentScroll(e) {
        if (this.pause) return;
        // console.log(e);
        for(let grp of this.content.children) {
            grp.onScroll();//this.timeGraphHeader.getGutterWidth()-1, true);
        }

    }

     update(arg, val) {
         if (this.pause) return;
         if (!arg) {
            let f = this.timeGraphHeader.getStartTime();
            let l = this.timeGraphHeader.getEndTime();
            let w = this.timeGraphHeader.getScaleWidth();
            let x = this.timeGraphHeader.getGutterWidth() - 1;
            let y = this.timeGraphHeader.offsetHeight + 1 + 'px';

            for(let i = 0; i < this.gridLines.length; i++) {
                let gridLine = this.gridLines[i];
                if (i >= f && i < l) {
                    gridLine.style.display = '';
                    gridLine.style.width = w + 'px';
                    gridLine.style.left = x + 'px';
                    gridLine.style.top = y;
                    x+=w;
                } else {
                    gridLine.style.display = 'none';
                }
            }
            this.notifyGroups();
        } else {
            if (arg >= 0 && arg <= this.gridLines.length) {
                if (val === false) {
                    this.gridLines[arg].classList.remove('selected');
                } else {
                    this.gridLines[arg].classList.add('selected');
                }
            }
        }
    }

    clearGroups() {
        while(this.content.firstChild)
            this.content.firstChild.remove();
    }

    addGroup(group) {
        let ug = new UXTimeGraphGroup();
            ug.setAttribute('title', group.title + " - " + group.subtitle);
            ug.setAttribute('label', group.title);
            ug.setAttribute('sublabel', group.subtitle);
            
        this.content.appendChild(ug);
    }

    pauseRedraw() {
        this.pause = true;
    }

    releasePause() {
        this.pause = false;
    }
}


/*************************************************************************** 
 *
 *  TIME GRAPH SUBGROUP:  
 * 
 **************************************************************************/
class UXTimeGraphSubGroup extends UXWidget {
    static get observedAttributes() {
        return ['label'];
    }
   
    constructor(label) {
        super();
        this.classList.add('ux-timegraph-subgroup');
        this.connected = false;
        this.content = document.createElement('div');
            this.content.className = 'content';
        this.gutterBar = document.createElement('div');
            this.gutterBar.className = 'gutter-bar ux-button border-raised';
        this.label = document.createElement('label');
        this.gutterBar.appendChild(this.label);
        this.setAttribute('label', label);
    }

    connectedCallback() {
        if (this.connected) return;
        this.appendChild(this.gutterBar);
        this.appendChild(this.content);
        this.connected = true;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (typeof(newValue) === 'string')
        this.label.innerText = newValue;
    }

    onResize(gutterWidth) {
        this.gutterBar.style.width = gutterWidth + 'px';
    }
}

/*************************************************************************** 
 *
 *  TIME GRAPH GROUP:  
 * 
 **************************************************************************/

class UXTimeGraphGroup extends UXWidget {
    static get observedAttributes() {
        return ['label', 'sublabel'];
    }
    
    constructor() {
        super();
        this.classList.add('ux-timegraph-group');
        this.connected = false;

        this.headerBar = document.createElement('div');
            this.headerBar.className= 'header-bar border-raised expanded';
        this.label = document.createElement('label');
            this.label.className = 'primary';
        this.sublabel = document.createElement('label');
            this.sublabel.classList = 'secondary';
        this.headerBar.addEventListener('click', this.onToggle.bind(this));
        this.headerBar.appendChild(this.label);
        this.headerBar.appendChild(this.sublabel);
        
        this.content = document.createElement('div');
            this.content.className = 'content';
        this.content.style.display = 'none';
    }

    connectedCallback() {
        if (this.connected) return;
        this.appendChild(this.headerBar);
        this.appendChild(this.content);
        for(let d of DAY_NAMES) {
            let subgroup = new UXTimeGraphSubGroup(d.substr(0, 3));
            this.content.appendChild(subgroup);
        }
        this.connected = true;
    }

    onToggle(e) {
        
        

        if (e.detail === 2) {
            if (this.content.style.display === '') {
                this.headerBar.classList.remove('expanded');
                this.content.style.display = 'none';
            } else {
                this.headerBar.classList.add('expanded');
                this.content.style.display = '';
            }
        } else {
            for(let c of this.parentNode.children) {
                if (c instanceof UXTimeGraphGroup) 
                    c.setSelected(c === this);
            }
        }
        this.ensureVisible();
        this.parentNode.dispatchEvent(new CustomEvent('scroll'));

    }

    setSelected(b) {
        console.log('@selected', b);
        if (b !== true) {
            this.headerBar.classList.remove('selected');
        } else {
            this.headerBar.classList.add('selected');
        }
    }

    onResize(gutterWidth, show) {
        for(let sub of this.content.children) {
            sub.onResize(gutterWidth);
        }
        if (show === true) {
            this.content.style.display = '';
        }
    }

    ensureVisible() {
        let scrollTop = this.parentNode.scrollTop;
        let headerHeight = this.headerBar.getBoundingClientRect().height;
        let rect = this.getBoundingClientRect();
        let pRect = this.parentNode.getBoundingClientRect();
        let t = rect.top - pRect.top;
        let b = t + rect.height+scrollTop;
        let h = pRect.bottom+scrollTop;
        
        if (t < 0 && b > 0) {
            this.parentNode.scrollTop = (t+scrollTop);
            return true;
        } else if (b > h) {
            let bDelta = b-pRect.height+headerHeight;
            this.parentNode.scrollTop = bDelta;
            return true;
        }
        return false;
    }

    onScroll() {
        console.log(this.parentNode.scrollTop);
        let headerHeight = this.headerBar.getBoundingClientRect().height;
        let rect = this.getBoundingClientRect();
        let pRect = this.parentNode.getBoundingClientRect();
        let t = rect.top - pRect.top;
        let b = t + rect.height;

        if (t <= 0 && b > 0 && this.content.style.display === '') {
            let y = -t;
            if (b < headerHeight) y= (y-(headerHeight-b));
            this.headerBar.classList.add('sticky');
            this.headerBar.style.top = y + 'px';
            this.content.style.marginTop = headerHeight + 'px';
        } else {
            this.headerBar.classList.remove('sticky');
            this.content.style.marginTop = '';
            this.headerBar.style.top = '';
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case 'label':
                this.setLabel(newValue);
                break;
            case 'sublabel':
                this.setSublabel(newValue);
                break;
        }
    }

    setLabel(value) {
        if (typeof(value) === 'string') {
            this.label.innerText = value;
        }
    }

    setSublabel(value) {
        if (typeof(value) === 'string') {
            this.sublabel.innerText = value;
        }
    }
}


customElements.define('ux-timegraph-header', UXTimeGraphHeader);
customElements.define('ux-timegraph', UXTimeGraph);
customElements.define('ux-timegraph-subgroup', UXTimeGraphSubGroup);
customElements.define('ux-timegraph-group', UXTimeGraphGroup);
