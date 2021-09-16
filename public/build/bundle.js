
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.6' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.42.6 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let form;
    	let h1;
    	let t1;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let input3;
    	let t5;
    	let input4;
    	let t6;
    	let input5;
    	let t7;
    	let hr;
    	let t8;
    	let output0;
    	let t9;
    	let t10;
    	let output1;
    	let t11;
    	let t12;
    	let footer;
    	let t13;
    	let a;
    	let t15;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "SHA1 -> RC2";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			t5 = space();
    			input4 = element("input");
    			t6 = space();
    			input5 = element("input");
    			t7 = space();
    			hr = element("hr");
    			t8 = space();
    			output0 = element("output");
    			t9 = text(/*hex*/ ctx[4]);
    			t10 = space();
    			output1 = element("output");
    			t11 = text(/*bin*/ ctx[5]);
    			t12 = space();
    			footer = element("footer");
    			t13 = text("By ");
    			a = element("a");
    			a.textContent = "Clayton Cook";
    			t15 = text(" using Svelte");
    			add_location(h1, file, 48, 2, 1245);
    			attr_dev(input0, "type", "password");
    			attr_dev(input0, "placeholder", "Key");
    			attr_dev(input0, "class", "svelte-fh8ifj");
    			add_location(input0, file, 49, 2, 1268);
    			attr_dev(input1, "placeholder", "Message");
    			attr_dev(input1, "class", "svelte-fh8ifj");
    			add_location(input1, file, 50, 2, 1330);
    			attr_dev(input2, "type", "password");
    			attr_dev(input2, "placeholder", "Password");
    			attr_dev(input2, "class", "svelte-fh8ifj");
    			add_location(input2, file, 51, 2, 1385);
    			attr_dev(input3, "type", "number");
    			attr_dev(input3, "min", "1");
    			attr_dev(input3, "max", "48");
    			attr_dev(input3, "class", "svelte-fh8ifj");
    			add_location(input3, file, 52, 2, 1458);
    			attr_dev(input4, "type", "submit");
    			input4.value = "Encrypt";
    			attr_dev(input4, "class", "svelte-fh8ifj");
    			add_location(input4, file, 53, 2, 1520);
    			attr_dev(input5, "type", "submit");
    			input5.value = "Decrypt";
    			attr_dev(input5, "class", "svelte-fh8ifj");
    			add_location(input5, file, 54, 2, 1596);
    			add_location(hr, file, 55, 2, 1672);
    			attr_dev(output0, "class", "svelte-fh8ifj");
    			add_location(output0, file, 56, 2, 1681);
    			attr_dev(output1, "class", "svelte-fh8ifj");
    			add_location(output1, file, 57, 2, 1706);
    			attr_dev(a, "href", "https://www.claytonleonardcook.com");
    			add_location(a, file, 59, 7, 1747);
    			attr_dev(footer, "class", "svelte-fh8ifj");
    			add_location(footer, file, 58, 2, 1731);
    			attr_dev(form, "class", "svelte-fh8ifj");
    			add_location(form, file, 47, 0, 1236);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, h1);
    			append_dev(form, t1);
    			append_dev(form, input0);
    			set_input_value(input0, /*iv*/ ctx[0]);
    			append_dev(form, t2);
    			append_dev(form, input1);
    			set_input_value(input1, /*message*/ ctx[1]);
    			append_dev(form, t3);
    			append_dev(form, input2);
    			set_input_value(input2, /*password*/ ctx[2]);
    			append_dev(form, t4);
    			append_dev(form, input3);
    			set_input_value(input3, /*length*/ ctx[3]);
    			append_dev(form, t5);
    			append_dev(form, input4);
    			append_dev(form, t6);
    			append_dev(form, input5);
    			append_dev(form, t7);
    			append_dev(form, hr);
    			append_dev(form, t8);
    			append_dev(form, output0);
    			append_dev(output0, t9);
    			append_dev(form, t10);
    			append_dev(form, output1);
    			append_dev(output1, t11);
    			append_dev(form, t12);
    			append_dev(form, footer);
    			append_dev(footer, t13);
    			append_dev(footer, a);
    			append_dev(footer, t15);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[10]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[11]),
    					listen_dev(input4, "click", prevent_default(/*encrypt*/ ctx[6]), false, true, false),
    					listen_dev(input5, "click", prevent_default(/*decrypt*/ ctx[7]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*iv*/ 1 && input0.value !== /*iv*/ ctx[0]) {
    				set_input_value(input0, /*iv*/ ctx[0]);
    			}

    			if (dirty & /*message*/ 2 && input1.value !== /*message*/ ctx[1]) {
    				set_input_value(input1, /*message*/ ctx[1]);
    			}

    			if (dirty & /*password*/ 4 && input2.value !== /*password*/ ctx[2]) {
    				set_input_value(input2, /*password*/ ctx[2]);
    			}

    			if (dirty & /*length*/ 8 && to_number(input3.value) !== /*length*/ ctx[3]) {
    				set_input_value(input3, /*length*/ ctx[3]);
    			}

    			if (dirty & /*hex*/ 16) set_data_dev(t9, /*hex*/ ctx[4]);
    			if (dirty & /*bin*/ 32) set_data_dev(t11, /*bin*/ ctx[5]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let iv = "", message = "", password = "", length = 10;
    	let hex = "", bin = "";

    	function encrypt() {
    		$$invalidate(0, iv = iv || "key");
    		$$invalidate(1, message = message || "message");
    		$$invalidate(2, password = password || "password");
    		console.log("Encrypting...");
    		const HASH = forge.md.sha1.create();
    		HASH.update(message);
    		console.log(`${message} \n -(SHA1)->\n${HASH.digest().toHex()}`);
    		const CIPHER = forge.rc2.createEncryptionCipher(password);
    		CIPHER.start(iv);
    		CIPHER.update(forge.util.createBuffer(HASH.digest().data));
    		CIPHER.finish();
    		console.log(`${HASH.digest().toHex()} \n -(RC2)->\n${CIPHER.output.toHex()}`);
    		$$invalidate(4, hex = `${CIPHER.output.toHex().substring(0, length)} / ${CIPHER.output.toHex().substring(length)}`);
    		$$invalidate(5, bin = CIPHER.output.data);
    	}

    	function decrypt() {
    		$$invalidate(0, iv = iv || "key");
    		$$invalidate(1, message = message || "message");
    		$$invalidate(2, password = password || "password");
    		console.log("Decrypting...");
    		const CIPHER = forge.rc2.createDecryptionCipher(password);
    		CIPHER.start(iv);
    		CIPHER.update(forge.util.createBuffer(forge.util.hexToBytes(message)));
    		CIPHER.finish();
    		$$invalidate(4, hex = CIPHER.output.toHex());
    		$$invalidate(5, bin = CIPHER.output.data);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		iv = this.value;
    		$$invalidate(0, iv);
    	}

    	function input1_input_handler() {
    		message = this.value;
    		$$invalidate(1, message);
    	}

    	function input2_input_handler() {
    		password = this.value;
    		$$invalidate(2, password);
    	}

    	function input3_input_handler() {
    		length = to_number(this.value);
    		$$invalidate(3, length);
    	}

    	$$self.$capture_state = () => ({
    		iv,
    		message,
    		password,
    		length,
    		hex,
    		bin,
    		encrypt,
    		decrypt
    	});

    	$$self.$inject_state = $$props => {
    		if ('iv' in $$props) $$invalidate(0, iv = $$props.iv);
    		if ('message' in $$props) $$invalidate(1, message = $$props.message);
    		if ('password' in $$props) $$invalidate(2, password = $$props.password);
    		if ('length' in $$props) $$invalidate(3, length = $$props.length);
    		if ('hex' in $$props) $$invalidate(4, hex = $$props.hex);
    		if ('bin' in $$props) $$invalidate(5, bin = $$props.bin);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		iv,
    		message,
    		password,
    		length,
    		hex,
    		bin,
    		encrypt,
    		decrypt,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
