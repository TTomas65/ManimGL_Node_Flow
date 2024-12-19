class NumComponent extends Rete.Component {
    constructor() {
        super("Szám");
        this.task = {
            outputs: { num: 'output' }
        }
    }

    builder(node) {
        const out = new Rete.Output('num', "Szám", numSocket);
        const ctrl = new NumControl(this.editor, 'num');

        return node.addControl(ctrl).addOutput(out);
    }
}

class NumControl extends Rete.Control {
    constructor(emitter, key) {
        super(key);
        this.component = {
            props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
            template: '<input type="number" :readonly="readonly" :value="value" @input="change($event)"/>',
            data() {
                return {
                    value: 0,
                }
            },
            methods: {
                change(e) {
                    this.value = +e.target.value;
                    this.update();
                },
                update() {
                    if (this.ikey)
                        this.putData(this.ikey, this.value)
                    this.emitter.trigger('process');
                }
            },
            mounted() {
                this.value = this.getData(this.ikey);
            }
        }
        this.props = { emitter, ikey: key };
    }
}

const numSocket = new Rete.Socket('Number');
const textSocket = new Rete.Socket('Text');
const colorSocket = new Rete.Socket('Color');

numSocket.combineWith(textSocket);
numSocket.combineWith(colorSocket);
textSocket.combineWith(colorSocket);

class ColorSetupNode extends Rete.Component {
    constructor() {
        super("COLOR_SETUP_01");
        this.data = { color: '#FFFFFF' };
    }

    builder(node) {
        const out = new Rete.Output('color', "Color", colorSocket);
        node.addOutput(out);
        
        const ctrl = new ColorControl(this.editor, 'color');
        node.addControl(ctrl);
        
        // Inicializáljuk a node adatait
        node.data.color = '#FFFFFF';
        
        return node;
    }

    worker(node, inputs, outputs) {
        const color = node.data.color || '#FFFFFF';
        console.log('ColorSetupNode processing - node data:', node.data);
        console.log('ColorSetupNode processing - color value:', color);
        outputs['color'] = color;
    }
}

class TextSetupNode extends Rete.Component {
    constructor() {
        super("TEXT_SETUP_01");
        this.data = {
            text: 'Sample Text',
            fontSize: 32,
            fontFamily: 'Arial'
        };
    }

    builder(node) {
        const out = new Rete.Output('text', "Text", textSocket);
        node.addOutput(out);
        
        const textControl = new TextControl(this.editor, 'text');
        node.addControl(textControl);
        
        const fontSizeControl = new NumControl(this.editor, 'fontSize');
        node.addControl(fontSizeControl);
        
        const fontFamilyControl = new FontFamilyControl(this.editor, 'fontFamily');
        node.addControl(fontFamilyControl);
        
        return node;
    }

    worker(node, inputs, outputs) {
        const textData = {
            text: node.data.text || 'Sample Text',
            fontSize: node.data.fontSize || 32,
            fontFamily: node.data.fontFamily || 'Arial'
        };
        outputs['text'] = textData;
        console.log('TextSetupNode output:', textData);
    }
}

class AnimationTimeSetupNode extends Rete.Component {
    constructor() {
        super("ANIMATION_TIME_SETUP_01");
        this.data = { duration: 1.0 };
    }

    builder(node) {
        const out = new Rete.Output('time', "Animation Time", numSocket);
        node.addOutput(out);
        
        const durationControl = new NumControl(this.editor, 'duration');
        node.addControl(durationControl);
        
        return node;
    }

    worker(node, inputs, outputs) {
        const time = node.data.duration || 1.0;
        outputs['time'] = time;
        console.log('AnimationTimeSetupNode output:', time);
    }
}

class TextAnimColorNode extends Rete.Component {
    constructor() {
        super("TEXTANIM_COLOR_01");
        this.data = {
            color: '#FFFFFF',
            text: 'Sample Text',
            time: 1.0,
            fontSize: 32,
            fontFamily: 'Arial'
        };
    }

    builder(node) {
        const colorInput = new Rete.Input('color', "Color", colorSocket);
        const textInput = new Rete.Input('text', "Text", textSocket);
        const timeInput = new Rete.Input('time', "Time", numSocket);
        const out = new Rete.Output('output', "Output", numSocket);

        node.addInput(colorInput);
        node.addInput(textInput);
        node.addInput(timeInput);
        node.addOutput(out);

        return node;
    }

    async worker(node, inputs, outputs) {
        console.log('TextAnimColorNode inputs:', inputs);

        // Color input
        let color = '#FFFFFF';
        if (inputs['color'] && inputs['color'].length > 0) {
            const inputColor = inputs['color'][0];
            color = typeof inputColor === 'string' ? inputColor : 
                   typeof inputColor === 'object' && inputColor.color ? inputColor.color : 
                   '#FFFFFF';
            console.log('Received color input:', inputColor, 'Processed color:', color);
        }

        // Text input
        let text = 'Sample Text';
        let fontSize = 32;
        let fontFamily = 'Arial';
        if (inputs['text'] && inputs['text'].length > 0) {
            const textData = inputs['text'][0];
            if (typeof textData === 'object') {
                text = textData.text || text;
                fontSize = textData.fontSize || fontSize;
                fontFamily = textData.fontFamily || fontFamily;
            }
        }

        // Time input
        let time = 1.0;
        if (inputs['time'] && inputs['time'].length > 0) {
            time = parseFloat(inputs['time'][0]) || time;
        }

        // Store the data both in node and global state
        const newData = { text, color, time, fontSize, fontFamily };
        node.data = newData;
        lastAnimationData = { ...newData };
        outputs['output'] = newData;
        
        console.log('TextAnimColorNode final data:', node.data);
        console.log('Last animation data:', lastAnimationData);
    }

    generateManimCode(text, color, time, fontSize, fontFamily) {
        console.log('Generating code with input values:', { text, color, time, fontSize, fontFamily });
        const rgb = this.hexToRgb(color);
        
        text = text || 'Sample Text';
        time = typeof time === 'number' ? time : 1.0;
        fontSize = typeof fontSize === 'number' ? fontSize : 32;
        fontFamily = fontFamily || 'Arial';
        
        console.log('Using RGB values:', rgb);
        
        return `from manimlib import *
import numpy as np

class TextAnimation(Scene):
    def construct(self):
        text = Text("${text}",
                   font="${fontFamily}",
                   font_size=${fontSize},
                   color=rgb_to_color([${rgb.r/255}, ${rgb.g/255}, ${rgb.b/255}]))
        
        self.play(
            Write(text),
            run_time=${time}
        )
        
        self.wait(1)
`;
    }

    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string') {
            console.log('Invalid color value:', hex);
            return { r: 255, g: 255, b: 255 }; 
        }

        hex = hex.replace('#', '');
        
        try {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            
            console.log('Converted color:', hex, 'to RGB:', { r, g, b });
            
            if (isNaN(r) || isNaN(g) || isNaN(b)) {
                console.error('Invalid RGB values:', { r, g, b });
                return { r: 255, g: 255, b: 255 };
            }
            
            return { r, g, b };
        } catch (error) {
            console.error('Error converting color:', error);
            return { r: 255, g: 255, b: 255 }; 
        }
    }
}

class ColorControl extends Rete.Control {
    constructor(emitter, key) {
        super(key);
        this.component = {
            props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
            template: '<input type="color" :value="value" @input="change($event)"/>',
            data() {
                return {
                    value: '#FFFFFF'
                }
            },
            methods: {
                change(e) {
                    const newColor = e.target.value;
                    this.value = newColor;
                    this.update();
                },
                update() {
                    if (this.ikey) {
                        this.putData(this.ikey, this.value);
                        this.emitter.trigger('process');
                    }
                }
            },
            mounted() {
                this.value = this.getData(this.ikey) || '#FFFFFF';
            }
        };
        this.props = { emitter, ikey: key };
    }
}

class TextControl extends Rete.Control {
    constructor(emitter, key) {
        super(key);
        this.component = {
            props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
            template: '<input type="text" :value="value" @input="change($event)" placeholder="Enter text"/>',
            data() {
                return {
                    value: 'Sample Text',
                }
            },
            methods: {
                change(e) {
                    this.value = e.target.value;
                    this.update();
                },
                update() {
                    if (this.ikey)
                        this.putData(this.ikey, this.value);
                    this.emitter.trigger('process');
                }
            },
            mounted() {
                this.value = this.getData(this.ikey) || 'Sample Text';
            }
        };
        this.props = { emitter, ikey: key };
    }
}

class FontFamilyControl extends Rete.Control {
    constructor(emitter, key) {
        super(key);
        this.component = {
            props: ['readonly', 'emitter', 'ikey', 'getData', 'putData'],
            template: `
                <select :value="value" @change="change($event)">
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                </select>
            `,
            data() {
                return {
                    value: 'Arial',
                }
            },
            methods: {
                change(e) {
                    this.value = e.target.value;
                    this.update();
                },
                update() {
                    if (this.ikey)
                        this.putData(this.ikey, this.value);
                    this.emitter.trigger('process');
                }
            },
            mounted() {
                this.value = this.getData(this.ikey) || 'Arial';
            }
        };
        this.props = { emitter, ikey: key };
    }
}

let editor = null;
let engine = null;
let animationNode = null;
let lastAnimationData = {
    text: 'Sample Text',
    color: '#FFFFFF',
    time: 1.0,
    fontSize: 32,
    fontFamily: 'Arial'
};

async function initEditor() {
    const container = document.querySelector('#rete');
    editor = new Rete.NodeEditor('demo@1.0.0', container);
    
    editor.use(ConnectionPlugin.default);
    editor.use(VueRenderPlugin.default);    
    editor.use(AreaPlugin);

    const textAnimNode = new TextAnimColorNode();
    const colorSetupNode = new ColorSetupNode();
    const textSetupNode = new TextSetupNode();
    const timeSetupNode = new AnimationTimeSetupNode();

    editor.register(textAnimNode);
    editor.register(colorSetupNode);
    editor.register(textSetupNode);
    editor.register(timeSetupNode);

    engine = new Rete.Engine('demo@1.0.0');
    engine.register(textAnimNode);
    engine.register(colorSetupNode);
    engine.register(textSetupNode);
    engine.register(timeSetupNode);

    // Create initial nodes
    const node1 = await textAnimNode.createNode();
    node1.position = [400, 200];
    await editor.addNode(node1);
    animationNode = node1;

    const node2 = await colorSetupNode.createNode();
    node2.position = [100, 100];
    await editor.addNode(node2);

    const node3 = await textSetupNode.createNode();
    node3.position = [100, 300];
    await editor.addNode(node3);

    const node4 = await timeSetupNode.createNode();
    node4.position = [100, 500];
    await editor.addNode(node4);

    // RUN button
    const runButton = document.querySelector('#run-button');
    if (runButton) {
        runButton.onclick = async () => {
            try {
                console.log('Processing nodes...');
                await engine.process(editor.toJSON());
                console.log('Running animation...');
                await runAnimation();
            } catch (error) {
                console.error('Error:', error);
            }
        };
    }

    editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
        try {
            await engine.abort();
            await engine.process(editor.toJSON());
            
            // Update the animationNode reference
            const nodes = editor.nodes;
            animationNode = nodes.find(n => n.name === "TEXTANIM_COLOR_01");
        } catch (error) {
            console.error('Error processing nodes:', error);
        }
    });
}

window.addEventListener('load', () => {
    initEditor().catch(console.error);
});

async function runAnimation() {
    console.log('Running animation with last data:', lastAnimationData);
    
    if (!lastAnimationData) {
        console.error('No animation data available');
        return;
    }

    const component = new TextAnimColorNode();
    const pythonCode = component.generateManimCode(
        lastAnimationData.text,
        lastAnimationData.color,
        lastAnimationData.time,
        lastAnimationData.fontSize,
        lastAnimationData.fontFamily
    );
    
    console.log('Generated Python code:', pythonCode);
    
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('generate-animation', { pythonCode });
    
    ipcRenderer.once('animation-complete', (event, result) => {
        console.log('Animation completed:', result);
    });
    
    ipcRenderer.once('animation-error', (event, error) => {
        console.error('Animation error:', error);
    });
}
