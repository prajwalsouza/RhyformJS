// Complete authored scene. The page supplies narration and transport.
export async function createStory(stage) {
  const scene = rhyform.scene(stage, {
    dimensions: 3,
    viewHeight: 8.8,
    background: "#f8f7f3",
    camera: { at: [5, 3.5, 9], lookAt: [0, 1.1, 0] },
    description:
      "A parabola becomes a bowl, then a saddle as one plus sign becomes minus.",
  });
  const chapters = [];
  function chapter(title, text, detail) {
    scene.prepare();
    chapters.push({ time: scene.duration, title, text, detail });
  }
  const bowl = { type: "heightField", fn: (x, z) => (x * x + z * z) / 3 };
  const saddle = { type: "heightField", fn: (x, z) => (x * x - z * z) / 3 };
  const surface = scene
    .shape({ ...bowl, at: [0, -1.5, 0], color: "#7faea1" })
    .tag("story/surface");
  const parabola = scene.curve((x) => [x, (x * x) / 3 - 1.5, 0], {
    range: [-2, 2],
    color: "#326e66",
    lineWidth: 4,
  });
  const equation = await scene.equation(String.raw`y=\frac{x^2}{3}`, {
    at: [0, 3.2, -2.5],
    width: 3.2,
    depth: 0.07,
    color: "#315e57",
  });
  equation.tag("story/equation");
  const bowlEquation = await scene.equationDescriptor(
    String.raw`y=\frac{x^2+z^2}{3}`,
    { width: 4.2 },
  );
  const saddleEquation = await scene.equationDescriptor(
    String.raw`y=\frac{x^2-z^2}{3}`,
    { width: 4.2 },
  );
  for (let i = 0; i < 9; i++) {
    const z = -2 + i / 2;
    scene
      .curve((x) => [x, (x * x + z * z) / 3 - 1.5, z], {
        range: [-2, 2],
        color: "#83a89f",
        lineWidth: 2,
      })
      .tag("construction/sections/" + i);
  }
  const across = scene.curve((z) => [0, (z * z) / 3 - 1.48, z], {
    range: [-2, 2],
    color: "#b77d3f",
    lineWidth: 4,
  });
  const along = scene.curve((x) => [x, (x * x) / 3 - 1.48, 0], {
    range: [-2, 2],
    color: "#245b53",
    lineWidth: 4,
  });
  const downwards = {
    type: "curve",
    range: [-2, 2],
    fn: (z) => [0, (-z * z) / 3 - 1.48, z],
  };

  chapter(
    "A question of shape",
    "How can a bowl become a saddle?",
    "Keep the same grid of points. Change just one sign in the rule that gives them height.",
  );
  surface.show(0);
  scene.wait(4);

  chapter(
    "One curve",
    "Begin with a parabola.",
    "Move left or right and the height rises with the square of the distance.",
  );
  surface.hide(0.7);
  parabola.draw(1.7);
  equation.draw(1.5);
  scene.wait(3);

  chapter(
    "A family of curves",
    "Move the curve sideways. Lift each copy a little.",
    "The extra height is z² / 3. Together, these parallel slices describe a bowl.",
  );
  scene.tag("construction").draw({ duration: 0.24, order: "sequential" });
  equation.transformTo(bowlEquation, { duration: 2 }).startNextImmediately();
  surface.draw(2);
  scene.wait(3);

  chapter(
    "Two directions",
    "Both directions bend upwards.",
    "The green curve runs along x. The amber curve runs along z. Each has a minimum at the center.",
  );
  scene.tag("construction").hide({ duration: 0.6 });
  parabola.hide(0.4);
  along.draw(1).startNextImmediately();
  across.draw(1);
  scene.camera.moveTo([6, 9, 8], 1.5);
  scene.wait(3);

  chapter(
    "One small change",
    "Keep the green curve. Turn the amber curve down.",
    "Replace +z² with −z². The equation, the amber slice, and the surface change together.",
  );
  equation
    .transformTo(saddleEquation, { duration: 3.5 })
    .startNextImmediately();
  surface.transformTo(saddle, { duration: 3.5 }).startNextImmediately();
  across.transformTo(downwards, { duration: 3.5 });
  scene.wait(2.5);

  chapter(
    "A different kind of center",
    "Up in one direction. Down in the other.",
    "The center is no longer a minimum. It is a saddle point: nearby points can lie either above or below it.",
  );
  scene.camera.moveTo([-6, 3.5, 9], 2.5);
  scene.wait(4);

  chapter(
    "The whole idea",
    "One sign changes the shape of space.",
    "A bowl adds the two squared distances. A saddle subtracts one. Same coordinates, a different height rule.",
  );
  scene.camera.moveTo([5, 3.5, 9], 2.5);
  scene.wait(5);
  scene.prepare();
  scene.seek(0);
  return { scene, chapters };
}
