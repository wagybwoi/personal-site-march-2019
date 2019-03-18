import {
  Application,
  Container,
  Graphics,
  filters,
  Filter,
  Loader,
  utils
} from "pixi.js";

// INIT
const init = ((loader, resources) => {
  // Console banners
  utils.skipHello();
  console.log(
    "%cwageh.me",
    "background-color: black; color: white; font-size: 20px; font-family: Courier New; padding: 5px;"
  );

  // Init pixi app
  let app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    backgroundColor: 0xffffff,
    autoResize: true
  });

  // Create canvas element
  let c = document.body.appendChild(app.view);
  c.classList.add("hide");

  // Create content
  var container = new Container();
  container.filterArea = app.screen;

  const lineCount = 20;
  const lineThickness = 2;
  let myGraph = new Graphics();
  for (let i = 0; i <= lineCount; i++) {
    const currentLineHeight = ((app.renderer.height - 10) / lineCount) * i + 5;
    myGraph
      .lineStyle(lineThickness, 0xffffff)
      .moveTo(0, currentLineHeight)
      .lineTo(app.renderer.width, currentLineHeight);
  }

  app.stage.addChild(container);
  container.addChild(myGraph);

  // Shader Filter
  filters.DistortionFilter = function() {
    let fragmentSrc = `
      precision highp float;
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float time;
      uniform float timeScaleX;
      uniform float timeScaleY;
      uniform float distortionScaleX;
      uniform float distortionScaleY;
      uniform vec4 textColor;

      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
          dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }
      
      void main() {
        vec2 uv = vTextureCoord;
        
        // FINAL OUTPUT
        gl_FragColor = 
          texture2D(uSampler, vec2(
            uv.x + (snoise(vec2(uv.x+time * timeScaleX,uv.y+time * timeScaleY))) * distortionScaleX,
            uv.y + (snoise(vec2(uv.x+time * timeScaleX,uv.y+time * timeScaleY))) * distortionScaleY
          ))
          * textColor;
      }
    `;
    Filter.call(this, null, fragmentSrc, {
      time: 0.0,
      timeScaleX: 0.0001,
      timeScaleY: 0.0003,
      distortionScaleX: 0.1,
      distortionScaleY: 0.15,
      textColor: [0.0, 0.0, 0.0, 1.0]
    });
  };

  filters.DistortionFilter.prototype = Object.create(Filter.prototype);
  filters.DistortionFilter.prototype.constructor = filters.DistortionFilter;

  let distortionFilter = new filters.DistortionFilter();
  container.filters = [distortionFilter];

  // Animator
  app.ticker.addOnce(() => {
    c.classList.remove("hide");
  });

  app.ticker.add(() => {
    distortionFilter.uniforms.time = app.ticker.lastTime;
  });

  // Events
  window.addEventListener("resize", () => {
    if (app.renderer) {
      app.renderer.resize(window.innerWidth, window.innerHeight);

      myGraph.clear();
      for (let i = 0; i <= lineCount; i++) {
        const currentLineHeight =
          ((app.renderer.height - 10) / lineCount) * i + 5;
        myGraph
          .lineStyle(lineThickness, 0xffffff)
          .moveTo(0, currentLineHeight)
          .lineTo(app.renderer.width, currentLineHeight);
      }
    }
  });
})();
