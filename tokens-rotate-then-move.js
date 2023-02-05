
// rotate tokens toward new location before the movement animation
var tokenRotateThenMove = async function(tokenDocument, update){
  if (!update.x) update.x = tokenDocument.x;
  if (!update.y) update.y = tokenDocument.y;
  let r = new Ray(tokenDocument, update);
  let rotation = r.angle*180/Math.PI-90;
  if (rotation < 0) rotation += 360;
  let difference = Math.max(tokenDocument.rotation, rotation) - Math.min(tokenDocument.rotation, rotation)
  if (difference > 180) difference -= 360;
  if (difference < -180) difference += 360;
  let duration = Math.round(Math.abs(difference)*Math.sqrt(tokenDocument.width)*game.settings.get("tokens-rotate-then-move", "rotateSpeedScale"));
  if (!tokenDocument.lockRotation) {
    await tokenDocument.update({rotation}, {animate:true, animation:{duration}});
    await new Promise((r) => setTimeout(r, duration));
  }
  duration = r.distance*3;
  await tokenDocument.update(update, {rotated: true, animate:true, animation:{duration: game.settings.get("tokens-rotate-then-move", "moveDuration")}})
}

Hooks.on("preUpdateToken", (tokenDocument, update, options) => {
  if (!game.settings.get("tokens-rotate-then-move", "enabled")) return;
  if ((update.hasOwnProperty('x') || update.hasOwnProperty('y'))){
    if (options.hasOwnProperty('rotated')) return true;
    tokenRotateThenMove(tokenDocument, update);
    return false;
  }
});

// dragging a token will show it's new rotation and a grabbing cursor
Hooks.on('refreshToken', (token)=>{
  if (!game.settings.get("tokens-rotate-then-move", "enabled")) return;
  if (token.layer.preview?.children[0]) {
    let clone = token.layer.preview?.children.find(c=>c.id==token.id)
    if (!clone) return;
    let r = new Ray(canvas.scene.tokens.get(token.id), clone)
    clone.mesh.angle = r.angle*180/Math.PI-90;
    token.cursor = 'grabbing';
  }
});

Hooks.on('getSceneControlButtons', (controls)=>{
  controls.find(c=>c.name=='token').tools.push({
    title: 'Rotate Then Move',
    name: "rtm-toggle",
    icon: 'fas fa-rotate',
    toggle: true,
    visible: true,
    active: game.settings.get("tokens-rotate-then-move", "enabled"),
    onClick: toggled => {
      game.settings.set("tokens-rotate-then-move", "enabled", toggled);
    }
  })
})

Hooks.once("init", async () => {
  
  game.settings.register('tokens-rotate-then-move', 'enabled', {
    name: `Enabled`,
    hint: `Determines whether tokens rotate before moving`,
    scope: "client",
    config: false,
    type: Boolean,
    default: true
  });

  game.settings.register('tokens-rotate-then-move', 'rotateSpeedScale', {
    name: `Rotation Speed Scale`,
    hint: `scale the speed of the rotation by this much`,
    scope: "world",
    config: true,
    type: Number,
    default: 1,
    onChange: value => { }
  });

  game.settings.register('tokens-rotate-then-move', 'moveDuration', {
    name: `Move Duration`,
    hint: `in milliseconds`,
    scope: "world",
    config: true,
    type: Number,
    default: 1000,
    onChange: value => {  }
  });

});