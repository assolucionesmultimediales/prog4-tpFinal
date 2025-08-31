//ml5 + p5: 1 gota que "la red" pulgar–índice puede atrapar ===
let handPose,
  video,
  hands = [];

// estrella
let posX,
  posY = 0;
const speedY = 2;
const dropR = 10; // radio fijo para detectar bien

// suavizado de tips, aunque no los muestre, si los saco, el programa deja de correr
let smThumb = { x: 0, y: 0, ready: false };
let smIndex = { x: 0, y: 0, ready: false };

//estrellita
let estrellita;

//fantasma
let fantasma;
let ghostX,
  ghostY = 0;
const ghostSpeedY = 2;
const GHOST_SCALE = 0.6; // más chico

//fuente
let fuente;
let mostrarLose = false;
let mostrarWin = false;

//puntajes
let puntaje = 0;
let sumaPuntos = 1;
let restaPuntos = 1;

function preload() {
  handPose = ml5.handPose(); // API nueva (v1.x)
  estrellita = loadImage("assets/estrellita.gif");
  fantasma = loadImage("assets/fantasma.gif");
  fuente = loadFont("assets/ARCADE_N.TTF");
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, gotHands);

  // inicio de la posicion de la estrella que cae
  posX = random(width);
  posY = 0;

  //inicio del fantasma
  ghostX = random(width);
  ghostY = 0;

  //texto
  textAlign(CENTER);
  textFont(fuente);
  rectMode(CENTER);
}

function draw() {
  image(video, 0, 0, width, height);

  //puntaje
  push();
  fill("yellow");
  noStroke();
  rect(83, 43, 140, 40, 10);
  pop();
  push();
  fill("#e185c7");
  noStroke();
  textSize(12);
  text("PUNTAJE:" + puntaje, 80, 50);
  pop();

  // estrella que cae
  noStroke();
  //fill(random(255), random(255), random(255));
  //circle(posX, posY, dropR * 3);
  image(estrellita, posX, posY);
  posY += speedY;

  // fantasma más chico
  image(
    fantasma,
    ghostX,
    ghostY,
    fantasma.width * GHOST_SCALE,
    fantasma.height * GHOST_SCALE
  );
  ghostY += ghostSpeedY;

  // respawn si salió de pantalla
  if (posY > height) {
    posY = 0;
    posX = random(width);
  }

  if (ghostY > height) {
    ghostY = 0;
    ghostX = random(width);
  }

  // red entre pulgar e índice
  if (hands.length > 0) {
    const h = hands[0];
    const { thumb, index } = getTips(h);

    // suavizar posiciones (menos jitter)
    const tS = smoothTo(thumb, smThumb, 0.5);
    const iS = smoothTo(index, smIndex, 0.5);

    // dibujar red
    const netW = 10; // grosor
    stroke("pink");
    strokeWeight(netW);
    line(tS.x, tS.y, iS.x, iS.y);

    //colicion de la estrella
    const cx = posX + estrellita.width * 0.5; // centro X estrella
    const cy = posY + estrellita.height * 0.5; // centro Y estrella
    const starR = Math.max(estrellita.width, estrellita.height) * 0.5;

    const dStar = pointSegDist(cx, cy, tS.x, tS.y, iS.x, iS.y);
    if (dStar < netW * 0.5 + starR * 0.45) {
      posY = 0;
      posX = random(width);
      puntaje += sumaPuntos;
      if (puntaje > 0) {
        mostrarLose = false;
        mostrarWin = false;
      } 
      if(puntaje >= 10){
      mostrarWin = true
      puntaje = 0
      }
    }

    //colision del fantasma
    const gW = fantasma.width * GHOST_SCALE; // ancho escalado
    const gH = fantasma.height * GHOST_SCALE; // alto escalado
    const gcx = ghostX + gW * 0.5; // centro X fantasma
    const gcy = ghostY + gH * 0.5; // centro Y fantasma
    const gR = Math.max(gW, gH) * 0.5; // radio aprox

    const dGhost = pointSegDist(gcx, gcy, tS.x, tS.y, iS.x, iS.y);
    if (dGhost < netW * 0.5 + gR * 0.45) {
      ghostY = 0;
      ghostX = random(width);
      puntaje -= restaPuntos;
      if (puntaje < 0) {
        push();
        textFont(fuente);
        text("you loose", width / 2, height / 2);
        pop();
        puntaje = 0;
        mostrarLose = true; // NUEVO: queda “pegado” el cartel
      }
    }

    if (mostrarLose) {
      push();
      noStroke();
      fill('yellow');
      textAlign(CENTER, CENTER);
      textFont(fuente);
      textSize(50)
      text("you loose", width / 2, height / 2);
      pop();
    }

    if(mostrarWin){
  push();
      noStroke();
      fill('yellow');
      textAlign(CENTER, CENTER);
      textFont(fuente);
      textSize(50)
      text("you win", width / 2, height / 2);
      pop();
    }

    /* // (opcional) tips visibles
noStroke();
fill(255, 0, 0);   circle(iS.x, iS.y, 12);   // índice
fill(0, 120, 255); circle(tS.x, tS.y, 12);   // pulgar
*/
  }
}

// obtener tips por nombre (API v1.x usa .name)
function getTips(hand) {
  let thumb = null,
    index = null;
  for (let kp of hand.keypoints) {
    if (kp.name === "thumb_tip") thumb = kp;
    if (kp.name === "index_finger_tip") index = kp;
  }
  return { thumb, index };
}

// suavizado exponencial simple
function smoothTo(target, sm, alpha = 0.6) {
  if (!sm.ready) {
    sm.x = target.x;
    sm.y = target.y;
    sm.ready = true;
  }
  sm.x = lerp(sm.x, target.x, alpha);
  sm.y = lerp(sm.y, target.y, alpha);
  return sm;
}

// distancia punto–segmento (para la "red")
function pointSegDist(px, py, ax, ay, bx, by) {
  const vx = bx - ax,
    vy = by - ay;
  const wx = px - ax,
    wy = py - ay;
  const c1 = vx * wx + vy * wy;
  const c2 = vx * vx + vy * vy;
  let t = 0;
  if (c2 > 0) t = constrain(c1 / c2, 0, 1);
  const qx = ax + t * vx,
    qy = ay + t * vy; // proyección en el segmento
  const dx = px - qx,
    dy = py - qy;
  return Math.sqrt(dx * dx + dy * dy);
}

function gotHands(results) {
  hands = results;
}
