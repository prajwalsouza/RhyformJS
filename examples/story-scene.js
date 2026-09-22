// Complete authored scene. The page supplies narration and transport.
export async function createStory(stage) {
  const scene = rhyform.scene(stage, {
    dimensions: 3,
    viewHeight: 7.8,
    background: "#0b1012",
    camera: { at: [4, 7, 12], lookAt: [0, 0.65, 0] },
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
    .shape({ ...bowl, at: [0, -0.7, 0], color: "#28594f" })
    .tag("story/surface");
  const parabola = scene.curve((x) => [x, (x * x) / 3 - 0.7, 0], {
    range: [-2, 2],
    color: "#a2ddc3",
    lineWidth: 4,
  });
  const equation = await scene.equation(String.raw`y=\frac{x^2}{3}`, {
    at: [-0.4, 3.6, -1.2],
    rotation: [-27.89, 16.42, 8.51],
    width: 1.65,
    depth: 0.025,
    color: "#eee9d8",
  });
  equation.tag("story/equation");
  const bowlEquation = await scene.equationDescriptor(
    String.raw`y=\frac{x^2+z^2}{3}`,
    { width: 2.5, depth: 0.025, color: "#eee9d8" },
  );
  const saddleEquation = await scene.equationDescriptor(
    String.raw`y=\frac{x^2-z^2}{3}`,
    { width: 2.5, depth: 0.025, color: "#eee9d8" },
  );
  for (let i = 0; i < 9; i++) {
    const z = -2 + i / 2;
    scene
      .curve((x) => [x, (x * x + z * z) / 3 - 0.7, z], {
        range: [-2, 2],
        color: "#7fbaa7",
        lineWidth: 2,
      })
      .tag("construction/sections/" + i);
  }
  const across = scene.curve((z) => [0, (z * z) / 3 - 0.68, z], {
    range: [-2, 2],
    color: "#e9bc74",
    lineWidth: 4,
  });
  const along = scene.curve((x) => [x, (x * x) / 3 - 0.68, 0], {
    range: [-2, 2],
    color: "#b3ebcc",
    lineWidth: 4,
  });
  const downwards = {
    type: "curve",
    range: [-2, 2],
    fn: (z) => [0, (-z * z) / 3 - 0.68, z],
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
  equation.rotateTo([-34.83, 15.3, 10.41], 1.5).startNextImmediately();
  scene.camera.moveTo([4, 9, 12], 1.5);
  scene.wait(3);

  chapter(
    "One small change",
    "Keep the green curve. Turn the amber curve down.",
    "Replace +z² with −z². The equation, the amber slice, and the surface change together.",
  );
  equation
    .transformTo(
      { ...saddleEquation, at: [-0.4, 2.6, -1.2] },
      { duration: 3.5 },
    )
    .startNextImmediately();
  surface
    .transformTo({ ...saddle, at: [0, 0.3, 0] }, { duration: 3.5 })
    .startNextImmediately();
  along.moveTo([0, 1, 0], 3.5).startNextImmediately();
  across.transformTo({ ...downwards, at: [0, 1, 0] }, { duration: 3.5 });
  scene.wait(2.5);

  chapter(
    "A different kind of center",
    "Up in one direction. Down in the other.",
    "The center is no longer a minimum. It is a saddle point: nearby points can lie either above or below it.",
  );
  equation.rotateTo([-27.89, -16.42, -8.51], 2.5).startNextImmediately();
  scene.camera.moveTo([-4, 7, 12], 2.5);
  scene.wait(4);

  chapter(
    "The whole idea",
    "One sign changes the shape of space.",
    "A bowl adds the two squared distances. A saddle subtracts one. Same coordinates, a different height rule.",
  );
  equation.rotateTo([-27.89, 16.42, 8.51], 2.5).startNextImmediately();
  scene.camera.moveTo([4, 7, 12], 2.5);
  scene.wait(5);
  scene.prepare();
  scene.seek(0);
  return { scene, chapters };
}
