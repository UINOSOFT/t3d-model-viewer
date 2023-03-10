import { Renderer, AnimationMixer, AnimationAction, LoadingManager, RenderTargetBack, ShadowMapPass, Scene, Camera, Vector3, Vector2, ShaderMaterial, Mesh, PlaneGeometry, AmbientLight, DirectionalLight, Texture2D, Color3, TEXEL_ENCODING_TYPE, Box3, Sphere, DRAW_MODE, Spherical } from 't3d';
import { OrbitControls } from 't3d/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 't3d/examples/jsm/loaders/glTF/GLTFLoader.js';
import { GLTFUtils } from 't3d/examples/jsm/loaders/glTF/GLTFUtils.js';
import { DRACOLoader } from 't3d/examples/jsm/loaders/DRACOLoader.js';
import { Texture2DLoader } from 't3d/examples/jsm/loaders/Texture2DLoader.js';
import { RGBELoader } from 't3d/examples/jsm/loaders/RGBELoader.js';
import { PMREM } from 't3d/examples/jsm/PMREM.js';
import { Clock } from 't3d/examples/jsm/Clock.js';
import { SkyBox } from 't3d/examples/jsm/objects/SkyBox.js';
import { default as environmentMap } from './environments.js';
import { ViewerEffectComposer, geometryReplaceFunction } from './viewer/ViewerEffectComposer.js';
import { LensflareMarker } from 't3d-effect-composer/examples/jsm/lensflare/LensflareMarker.js';
import { GroundShader } from './viewer/shader/GroundShader.js';
import Nanobar from 'nanobar';

DRACOLoader.setDecoderPath('./libs/draco/');

export class Viewer {

	constructor(el) {
		this.el = el;

		this.nanobar = new Nanobar();

		const canvas = document.createElement('canvas');
		canvas.width = el.clientWidth * window.devicePixelRatio;
		canvas.height = el.clientHeight * window.devicePixelRatio;
		canvas.style.width = el.clientWidth + "px";
		canvas.style.height = el.clientHeight + "px";
		this.el.appendChild(canvas);

		const width = canvas.clientWidth || 2;
		const height = canvas.clientHeight || 2;

		const gl = canvas.getContext("webgl2", {
			antialias: true,
			alpha: false,
			stencil: true
		});

		const renderer = new Renderer(gl);
		renderer.renderPass.setClearColor(0.2, 0.2, 0.2, 1);

		this.clock = new Clock();

		const backRenderTarget = new RenderTargetBack(canvas);
		backRenderTarget.resize(width, height);

		const shadowMapPass = new ShadowMapPass();
		shadowMapPass.getGeometry = geometryReplaceFunction;

		const effectComposer = new ViewerEffectComposer(width, height, renderer);

		const scene = new Scene();

		const fov = 45;

		const camera = new Camera();
		camera.position.set(8, 3, 8);
		camera.lookAt(new Vector3(0, 0, 0), new Vector3(0, 1, 0));
		camera.setPerspective(fov / 180 * Math.PI, width / height, 1, 1000);
		scene.add(camera);

		const skyBox = new SkyBox();
		skyBox.gamma = true;
		skyBox.level = 8;
		skyBox.renderLayer = 2;
		camera.add(skyBox);

		const groundMaterial = new ShaderMaterial(GroundShader);
		groundMaterial.acceptLight = true;
		groundMaterial.uniforms.showGrid = true;
		const ground = new Mesh(
			new PlaneGeometry(1, 1),
			groundMaterial
		);
		ground.receiveShadow = true;
		groundMaterial.metalness = 0;
		groundMaterial.roughness = 1;
		groundMaterial.transparent = true;
		groundMaterial.polygonOffset = true;
		groundMaterial.polygonOffsetFactor = 1;
		groundMaterial.polygonOffsetUnits = 1;
		scene.add(ground);

		const cameraControl = new OrbitControls(camera, canvas);

		const ambientLight = new AmbientLight(0xffffff, 0.3);
		scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 0.7);
		directionalLight.castShadow = true;
		directionalLight.shadow.cameraNear = 1;
		directionalLight.shadow.cameraFar = 20;
		directionalLight.shadow.mapSize.set(2048, 2048);
		directionalLight.shadow.bias = -0.004;
		directionalLight.shadow.windowSize = 30;
		directionalLight.lookAt(new Vector3(), new Vector3(0, 1, 0));
		scene.add(directionalLight);

		const directionalLightCamera = new DirectionalLight(0xffffff, 0.2);
		directionalLightCamera.position.set(8, 3, 8);
		directionalLightCamera.lookAt(new Vector3(), new Vector3(0, 1, 0));
		scene.add(directionalLightCamera);

		const directionalLight2 = new DirectionalLight(0xffffff, 0);
		directionalLight2.shadow.cameraNear = 1;
		directionalLight2.shadow.cameraFar = 20;
		directionalLight2.shadow.mapSize.set(2048, 2048);
		directionalLight2.shadow.bias = -0.004;
		directionalLight2.shadow.windowSize = 30;
		directionalLight2.position.set(8, 3, 8);
		directionalLight2.lookAt(new Vector3(), new Vector3(0, 1, 0));
		scene.add(directionalLight2);

		const textureLoader = new Texture2DLoader();

		const lensflareMarker = new LensflareMarker();
		lensflareMarker.occlusionScale = 0.1;
		const textureFlare0 = textureLoader.load("./textures/lensflare/lensflare0.png");
		const textureFlare3 = textureLoader.load("./textures/lensflare/lensflare3.png");
		lensflareMarker.lensflareElements = [
			{ texture: textureFlare0, color: new Color3(0.2, 0.2, 0.2), scale: 0.6, offset: 0 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.05, offset: 0.6 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.06, offset: 0.7 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.1, offset: 0.9 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.06, offset: 1 },
		];
		lensflareMarker.visible = false;
		directionalLight.add(lensflareMarker);

		const lensflareMarker2 = new LensflareMarker();
		lensflareMarker2.occlusionScale = 0.1;
		lensflareMarker2.lensflareElements = [
			{ texture: textureFlare0, color: new Color3(0.2, 0.2, 0.2), scale: 0.6, offset: 0 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.05, offset: 0.6 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.06, offset: 0.7 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.1, offset: 0.9 },
			{ texture: textureFlare3, color: new Color3(1, 1, 1), scale: 0.06, offset: 1 },
		];
		lensflareMarker2.visible = false;
		directionalLight2.add(lensflareMarker2);

		camera.gammaFactor = 2.0;
		camera.outputEncoding = TEXEL_ENCODING_TYPE.GAMMA;

		this._textureLoader = textureLoader;
		this._rgbeLoader = new RGBELoader();

		this.setEnvironmentTexture('Ice_Lake');

		// this._pixelRatio = pixelRatio;
		this._canvas = canvas;
		this._gl = gl;
		this._renderer = renderer;
		this._backRenderTarget = backRenderTarget;
		this._shadowMapPass = shadowMapPass;
		this._effectComposer = effectComposer;
		this._scene = scene;
		this._camera = camera;
		this._cameraDefault = 'perspective';
		this._fov = fov;
		this._skyBox = skyBox;
		this._ground = ground;
		this._cameraControl = cameraControl;
		this._ambientLight = ambientLight;
		this._directionalLight = directionalLight;
		this._directionalLightCamera = directionalLightCamera;
		this._directionalLight2 = directionalLight2;

		this._root = null;
		this._diagonal = new Vector3();
		this._diameter = null;
		this._wireframe = null;
		this.animations = null;
		this.actions = null;
		this.actionStates = null;
		this.timeScale = 1;

		this._cameraClip = {
			near: 1,
			far: 1000
		};
		this._boundingBox = new Box3();
		this._boundingSphere = new Sphere();
		this._lightCoord = new Vector2(30, 40);
		updateLightDirection(this._directionalLight, this._lightCoord, 10);
		updateLightDirection(this._directionalLight2, this._lightCoord, 10);

		this._animationFrame = null;
		this._running = false;

		window.addEventListener("resize", () => {
			this.resize();
		}, true);
	}

	startRender() {
		const loop = timeStamp => {
			if (this._running) {
				this._animationFrame = requestAnimationFrame(loop);
				this.tick(timeStamp);
			}
		};

		this._running = true;
		this._animationFrame = requestAnimationFrame(loop);
	}

	stopRender() {
		this._running = false;

		if (this._animationFrame !== null) {
			cancelAnimationFrame(this._animationFrame);
			this._animationFrame = null;
		}
	}

	tick(timeStamp) {
		this._cameraControl.update();

		this._scene.updateMatrix();
		this._scene.updateRenderStates(this._camera);
		this._scene.updateRenderQueue(this._camera);

		this._shadowMapPass.render(this._renderer, this._scene);
		this.animations && this.animations.update(this.clock.getDelta() * this.timeScale);

		this._directionalLightCamera.position.set(this._camera.position.x, this._camera.position.y, this._camera.position.z);
		this._directionalLightCamera.lookAt(new Vector3(0, 0, 0), new Vector3(0, 1, 0));

		this._effectComposer.render(this._renderer, this._scene, this._camera, this._backRenderTarget);
	}

	resize() {
		const { clientHeight, clientWidth } = this.el;
		this._canvas.style.width = clientWidth + "px";
		this._canvas.style.height = clientHeight + "px";

		const width = this._canvas.clientWidth || 2;
		const height = this._canvas.clientHeight || 2;

		if (this._cameraDefault === 'perspective') {
			this._camera.setPerspective(this._fov / 180 * Math.PI, width / height, this._cameraClip.near, this._cameraClip.far);
		} else {
			this._camera.setOrtho(-this._diameter * 2, this._diameter * 2, -this._diameter * 2 * aspect, this._diameter * 2 * aspect, -this._cameraClip.far, this._cameraClip.far);
		}
		this._backRenderTarget.resize(width, height);
		this._effectComposer.resize(width, height);
	}

	load(url, rootPath, assetMap) {
		this._ground.visible = false;
		const baseURL = this.extractUrlBase(url);

		// Load.
		return new Promise((resolve, reject) => {
			const nanobar = this.nanobar;
			// nanobar.el.style.background = "gray";
			const manager = new LoadingManager(function() {
				nanobar.go(100);
				// nanobar.el.style.background = "transparent";
			}, function(url, itemsLoaded, itemsTotal) {
				if (itemsLoaded < itemsTotal) {
					nanobar.go(itemsLoaded / itemsTotal * 100);
				}
			});
			// Intercept and override relative URLs.
			manager.setURLModifier((url, path) => {
				const normalizedURL = rootPath + decodeURI(url)
					.replace(baseURL, '')
					.replace(/^(\.?\/)/, '');

				if (assetMap && assetMap.has(normalizedURL)) {
					const blob = assetMap.get(normalizedURL);
					const blobURL = URL.createObjectURL(blob);
					blobURLs.push(blobURL);
					return blobURL;
				}

				return (path || '') + url;
			});

			const loader = new GLTFLoader(manager);
			loader.replaceParser(IndexParser, 0);
			loader.setDRACOLoader(new DRACOLoader());
			const blobURLs = [];

			loader.load(url)
				.then(gltf => {
					this._ground.visible = true;
					this.clear();
					this._boundingBox = new Box3();
					blobURLs.forEach(URL.revokeObjectURL);
					const root = gltf.root;
					root.traverse(node => {
						node.castShadow = true;
						node.receiveShadow = true;

						if (node.material) {
							node.material.drawMode = this._wireframe ? DRAW_MODE.LINES : DRAW_MODE.TRIANGLES;
							node.material.wireframe = this._wireframe || false;
							const emissive = node.material.emissive;
							if (emissive.r + emissive.g + emissive.b > 0.0) {
								node.effects = { 'Glow': 1 }
							}
						}
					});

					gltf.animations && this.setClips(gltf.animations);

					getBoundingBox(root, this._boundingBox);
					setBoundingSphereByBox(this._boundingBox, this._boundingSphere);

					const center = this._boundingSphere.center;
					this._diagonal.subVectors(this._boundingBox.max, this._boundingBox.min);
					const diameter = this._diagonal.getLength();
					this._diameter = diameter;

					root.position.x += (root.position.x - center.x);
					root.position.y += (root.position.y - center.y);
					root.position.z += (root.position.z - center.z);

					this._cameraControl.reset();
					this._cameraControl.maxDistance = diameter * 10;

					const { clientWidth, clientHeight } = this._canvas;
					const cameraNear = diameter / 100, cameraFar = diameter * 100;
					const aspect = clientHeight / clientWidth;
					if (this._cameraDefault === 'perspective') {
						this._camera.setPerspective(this._fov / 180 * Math.PI, clientWidth / clientHeight, cameraNear, cameraFar);
						this._camera.add(this._skyBox);
					} else {
						this._camera.setOrtho(-this._diameter * 2, this._diameter * 2, -this._diameter * 2 * aspect, this._diameter * 2 * aspect, -cameraFar, cameraFar);
						this._camera.remove(this._skyBox);
					}
					this._camera.position.copy(center);
					this._camera.position.x += diameter / 1.5;
					this._camera.position.y += diameter / 5.0;
					this._camera.position.z += diameter / 1.5;
					this._cameraClip.near = cameraNear;
					this._cameraClip.far = cameraFar;

					this._cameraControl.saveState();

					this._ground.position.y = -Math.abs(this._diagonal.y / 2);
					const groundSize = Math.max(30, Math.abs(Math.max(this._diagonal.x, this._diagonal.z) * 2));
					this._ground.scale.set(groundSize, 1, groundSize);
					let size = Math.abs(Math.max(this._diagonal.x, this._diagonal.z) * 2);
					size = Math.max(30, size);
					this._ground.material.uniforms.size = size / 2;
					this._ground.material.uniforms.gridSize = size / 10;
					this._ground.material.uniforms.gridSize2 = size / 50;

					updateLightDirection(this._directionalLight, this._lightCoord, this._boundingSphere.radius);
					updateLightDirection(this._directionalLight2, this._lightCoord, this._boundingSphere.radius);

					this._root = root;
					this._scene.add(root);
					resolve(gltf);
					printGraph(root);
				});
		});
	}

	setClips(clips) {
		if (!clips.length) return;

		this.animations = new AnimationMixer();
		clips.forEach(clip => {
			const action = this.actions = new AnimationAction(clip);
			this.animations.addAction(action);
		})
		this.actions = this.animations.getActions();

		let actionIndex = 0;

		this.actions[actionIndex].time = 0;
		this.actions[actionIndex].weight = 1;
	}

	playAllClips() {
		this.actions.forEach(actions => {
			if (!this.actionStates[actions.clip.name]) {
				actions.time = 0;
				actions.weight = 1;
				this.actionStates[actions.clip.name] = true;
			}
		});
	}
	stopAllClips() {
		this.actions.forEach(actions => {
			if (this.actionStates[actions.clip.name]) {
				actions.time = 0;
				actions.weight = 0;
				this.actionStates[actions.clip.name] = false;
			}
		});
	}

	setGlobal(options) {
		if (!this._root) return;

		this._wireframe = options.wireframe;

		this._root.traverse(node => {
			if (node.material) {
				node.material.drawMode = this._wireframe ? DRAW_MODE.LINES : DRAW_MODE.TRIANGLES;
				node.material.wireframe = this._wireframe;
			}
		});
	}

	setGround(options) {
		this._ground.visible = options.show;
		this._ground.material.uniforms.color = [parseInt(options.color.charAt(1) + options.color.charAt(2), 16) / 255, parseInt(options.color.charAt(3) + options.color.charAt(4), 16) / 255, parseInt(options.color.charAt(5) + options.color.charAt(6), 16) / 255, 1];
		this._ground.material.uniforms.showGrid = options.grid;
		let size = Math.abs(Math.max(this._diagonal.x, this._diagonal.z) * 2);
		size = Math.max(30, size);
		this._ground.material.uniforms.size = size / 2;
		this._ground.material.uniforms.gridSize = size / 10;
		this._ground.material.uniforms.gridSize2 = size / 50;
	}

	setEnvironmentTexture(key) {
		const { name, ext, tex } = environmentMap[key];

		if (tex) {
			this._scene.environment = tex;
			this._skyBox.texture = tex;
		} else {
			this._rgbeLoader.loadAsync(`./textures/${name}.${ext}`).then(textureData => {
				let texture = new Texture2D();
				texture.image = { data: textureData.data, width: textureData.width, height: textureData.height };
				texture.type = textureData.type;
				if (textureData.magFilter !== undefined) {
					texture.magFilter = textureData.magFilter;
				}
				if (textureData.minFilter !== undefined) {
					texture.minFilter = textureData.minFilter;
				}
				if (textureData.generateMipmaps !== undefined) {
					texture.generateMipmaps = textureData.generateMipmaps;
				}
				return texture;
			}).then(texture => {
				return PMREM.prefilterEnvironmentMap(this._renderer, texture, {
					sampleSize: 1024
				});
			}).then(texture => {
				environmentMap[key].tex = texture;

				this._scene.environment = texture;
				this._skyBox.texture = texture;
			});
		}
	}

	setEnvironmentParams(options) {
		this._scene.environmentLightIntensity = options.diffuseIntensity;
		this._skyBox.level = options.skyRoughness;
	}

	setAmbientLight(options) {
		this._ambientLight.intensity = options.intensity;

		setColor(this._ambientLight.color, options.color);
	}

	setDirectionalLight(options, light) {
		if (light == 0) {
			this._directionalLightCamera.intensity = options.intensity;
			setColor(this._directionalLightCamera.color, options.color);
		}

		if (light == 1) {
			this._directionalLight.intensity = options.intensity;

			setColor(this._directionalLight.color, options.color);

			this._lightCoord = options.direction;
			updateLightDirection(this._directionalLight, this._lightCoord, this._boundingSphere.radius);

			this._directionalLight.children[0].visible = options.lensflare;
		}

		if (light == 2) {
			this._directionalLight2.intensity = options.intensity;

			setColor(this._directionalLight2.color, options.color);

			this._lightCoord = options.direction;
			updateLightDirection(this._directionalLight2, this._lightCoord, this._boundingSphere.radius);

			this._directionalLight2.children[0].visible = options.lensflare;
		}
	}

	setPostEffect(options) {
		this._effectComposer.setOptions(options);
	}

	setDebugger(options) {
		this._effectComposer.setDebugger(options);
	}

	setCamera(options) {
		this._fov = options.fov;

		const width = this._canvas.clientWidth || 2;
		const height = this._canvas.clientHeight || 2;
		const aspect = height / width;
		if (options.type === 'perspective') {
			this._camera.setPerspective(this._fov / 180 * Math.PI, width / height, this._cameraClip.near, this._cameraClip.far);
			this._camera.add(this._skyBox);
			this._cameraDefault = 'perspective';
		} else {
			this._camera.setOrtho(-this._diameter * 2, this._diameter * 2, -this._diameter * 2 * aspect, this._diameter * 2 * aspect, -this._cameraClip.far, this._cameraClip.far);
			this._camera.remove(this._skyBox);
			this._cameraDefault = 'othographic';
		}

		if (options.outputEncoding === 'Gamma') {
			this._camera.outputEncoding = TEXEL_ENCODING_TYPE.GAMMA;
		} else {
			this._camera.outputEncoding = TEXEL_ENCODING_TYPE.LINEAR;
		}
	}

	setShadow(options, light) {
		if (light == 1) {
			this._directionalLight.castShadow = options.shadowenable;
			this._directionalLight.shadow.bias = options.shadowbias;
			const mapSize = ({ 'Ultra': 4096, 'High': 2048, 'Medium': 1024, 'Low': 512 })[options.shadowquality];
			this._directionalLight.shadow.mapSize.set(mapSize, mapSize);
		}
		if (light == 2) {
			this._directionalLight2.castShadow = options.shadowenable;
			this._directionalLight2.shadow.bias = options.shadowbias;
			const mapSize = ({ 'Ultra': 4096, 'High': 2048, 'Medium': 1024, 'Low': 512 })[options.shadowquality];
			this._directionalLight2.shadow.mapSize.set(mapSize, mapSize);
		}
	}

	clear() {
		if (!this._root) return;

		this._scene.remove(this._root);

		// dispose geometry
		this._root.traverse(node => {
			if (!node.geometry) return;
			node.geometry.dispose();
		});

		this._renderer.renderPass.clear(true, true, false);
	}

	extractUrlBase(url) {
		const index = url.lastIndexOf('/');
		if (index === -1) return './';
		return url.substr(0, index + 1);
	}

}

function printGraph(node) {
	console.group(' <' + node.constructor.name + '> ' + node.name);
	node.children.forEach(child => printGraph(child));
	console.groupEnd();
}

function setColor(color, hex) {
	color.r = parseInt(hex.charAt(1) + hex.charAt(2), 16) / 255;
	color.g = parseInt(hex.charAt(3) + hex.charAt(4), 16) / 255;
	color.b = parseInt(hex.charAt(5) + hex.charAt(6), 16) / 255;
}

function getBoundingBox(object, target) {
	const childBox = new Box3();

	object.updateMatrix();

	object.traverse(node => {
		if (node.geometry) {
			node.geometry.computeBoundingBox();
			childBox.copy(node.geometry.boundingBox).applyMatrix4(node.worldMatrix);
			target.expandByBox3(childBox);
		}
	});

	return target;
}

function setBoundingSphereByBox(box, target) {
	box.getCenter(target.center);

	const diagonal = new Vector3().subVectors(box.max, box.min);
	target.radius = diagonal.getLength() / 2;

	return target;
}

function updateLightDirection(light, coord, radius) {
	const phi = Math.PI / 2 - coord.y * Math.PI / 180;
	const theta = coord.x * Math.PI / 180;
	const spherical = new Spherical(radius, phi, theta);
	const position = new Vector3().setFromSpherical(spherical);

	light.position.set(position.x, position.y, position.z);

	light.lookAt(new Vector3(), new Vector3(0, 1, 0));

	light.shadow.windowSize = radius * 10;
	light.shadow.cameraNear = radius / 50;
	light.shadow.cameraFar = radius * 5;
}

export class IndexParser {

	static parse(context, loader) {
		const { url } = context;

		return loader.loadFile(url, 'arraybuffer').then(data => {
			context.data = data;

			const magic = GLTFUtils.decodeText(new Uint8Array(data, 0, 4));

			if (magic === 'glTF') {
				const glbData = GLTFUtils.parseGLB(data);
				context.gltf = glbData.gltf;
				context.buffers = glbData.buffers;
			} else {
				const gltfString = GLTFUtils.decodeText(new Uint8Array(data));
				context.gltf = JSON.parse(gltfString);
			}
		});
	}

}