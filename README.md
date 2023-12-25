
<img src="/images/rhyform.svg" alt="drawing" width="200"/>

# RhyformJS 🎨
Animating shapes, forms, creating visualizations especially for science. 🔬 An attempt to bring the magic of [Manim](https://github.com/3b1b/manim) to the web. 

Powered by [ViewX](https://github.com/prajwalsouza/viewX), [Protrace JS](https://github.com/kilobtye/potrace), [MathJax](https://github.com/mathjax/MathJax) and inspired by [Manim](https://github.com/3b1b/manim). ✨

>⚠️ **WARNING:** The library is far from complete, and still lacks 3D support, complex geometries, HTML canvas rendering, camera movement, etc. 🚧 
<br/>

<img src="/images/rhyform-demo.gif" alt="drawing" width="600"/>

## How to Use 🛠️

**Example: Creating a Scene with Objects**
```javascript
// Initialize a new scene
var myScene = rhyform.createScene("MyScene");

// Activate the created scene
rhyform.selectActiveScene(myScene);

// Generate a space within the 'body' element
var space = rhyform.createSpaceInElement("body", "MainSpace");

// Select the space for the current scene
myScene.selectSpace(space);

// Add a point in the space
var point1 = rhyform.createPoint({x: 1, y: 2});
point1.show();
```
🔗 Enjoy method chaining for concise and elegant code!

### Workflow for Displaying Objects 📌
- **Scene Creation**: `var myScene = rhyform.createScene("MyScene");` 
  Then, `rhyform.selectActiveScene(myScene);` to activate.
- **Space Creation**: `var space = rhyform.createSpaceInElement("body", "MainSpace");` 
  Follow with `myScene.selectSpace(space);` for selection.
- **Point Creation**: Use `point = rhyform.createPoint();` for a new point at the origin.
- **Point Positioning**: `point.place.at(x=2, y=2);` to set position (outside animation).
- **Color Change (Pre-animation)**: `point.loadWith.color('red');` for initial color.
- **Point Display**: `point.show();` to display the point (part of animation).
- **Color Change (During Animation)**: `point.change.color('blue');` for animated color change.
- **Play Scene**: Execute `myScene.play();` to animate the scene.

### Overview 🌐

`rhyform` library: Craft interactive math and graphical simulations with ease. Powered by `viewX` for diverse object support like Points, Lines, Curves, and more.

### Core Concepts 🧠

- **Scene**: Your animation or interactive canvas.
- **Space**: A 2D drawable area for objects.
- **Camera**: Manages view and zoom in a space.
- **Tags**: Logical grouping of objects within scenes/spaces.

### Object Types 📐

- **Point, Text, Line, Curve, Circle**: Basic drawable elements.
- **Button**: Interactive element with click functionality.
- **ValueSlider**: Numeric value adjuster.
- **Audio**: Embed and control sound.
- **Equation**: Render mathematical expressions.
- **VectorImage**: SVG to drawable object converter.

### Object Creation 🏗️
- `createScene`, `createSpaceInElement`, `createPoint`, `createText`, `createLine`, `createCurve`, `createCircle`, `createAudio`, `createButton`, `createSlider`: Functions to create various objects.

### Utility Functions 🛠️
- `hideElementsWithTag`, `showElementsWithTag`, `removeElementsWithTag`: Manage group animations in elements by tags.

### Detailed Object Descriptions 📖

**Points, Lines, Curves, Circles, Text, Buttons, ValueSliders, Audio, Equations, Vector Images**: Construction, properties, and methods detailed for each object type.


### Points

**Constructor and Properties:**
- `Point(at, size, color)`: Creates a point at the specified coordinates with given size and color.
    - `at`: Object specifying `x`, `y`, and optional `z` coordinates.
    - `size`: Numerical value for the size of the point.
    - `color`: String representing the color.

**Methods:**
- `show(inSeconds)`: Shows the point over a specified time period.
- `hide(inSeconds)`: Hides the point over a specified time period.
- `place.at(x, y, z)`: Sets the point's location.
- `loadWith.size(size)`: Changes the point's size.
- `loadWith.color(color)`: Changes the point's color.

### Lines

**Constructor and Properties:**
- `Line(between, thickness, color)`: Creates a line between two points.
    - `between`: An array of two Point objects.
    - `thickness`: Numerical value for the thickness of the line.
    - `color`: String representing the color.

**Methods:**
- `show(inSeconds)`: Shows the line over a specified time period.
- `hide(inSeconds)`: Hides the line over a specified time period.

### Curves

**Constructor and Properties:**
- `Curve(points, thickness, color, fillcolor)`: Creates a bezier curve through a series of points.
    - `points`: An array of Point objects.
    - `thickness`: Numerical value for the thickness of the curve.
    - `color`: String representing the color.
    - `fillcolor`: String representing the fill color.

**Methods:**
- `show(inSeconds)`: Shows the curve over a specified time period.
- `hide(inSeconds)`: Hides the curve over a specified time period.

### Circles

**Constructor and Properties:**
- `Circle(at, radius)`: Creates a circle at a specified point with a given radius.
    - `at`: A Point object for the center of the circle.
    - `radius`: Numerical value for the radius of the circle.

**Methods:**
- `show(inSeconds)`: Shows the circle over a specified time period.
- `hide(inSeconds)`: Hides the circle over a specified time period.

### Text

**Constructor and Properties:**
- `Text(content)`: Creates a text object with the specified content.
    - `content`: String or HTML content to display.

**Methods:**
- `show(inSeconds)`: Shows the text over a specified time period.
- `hide(inSeconds)`: Hides the text over a specified time period.

### Buttons

**Constructor and Properties:**
- `Button(content, onClick)`: Creates an interactive button with the given content and click handler.
    - `content`: String or HTML content to display.
    - `onClick`: Function to execute on click event.

**Methods:**
- `show(inSeconds)`: Shows the button over a specified time period.
- `hide(inSeconds)`: Hides the button over a specified time period.

### ValueSlider

**Constructor and Properties:**
- `ValueSlider(at, width, min, max, value, step, sliderProperties)`: Creates a slider to adjust numeric values.
    - `at`: Object specifying `x`, `y`, and optional `z` coordinates.
    - `width`: The visual width of the slider.
    - `min`: Minimum value of the slider.
    - `max`: Maximum value of the slider.
    - `value`: Initial value of the slider.
    - `step`: Step size of the slider.
    - `sliderProperties`: Object containing additional properties for customizing the appearance and behavior.

**Methods:**
- `show(inSeconds)`: Shows the slider over a specified time period.
- `hide(inSeconds)`: Hides the slider over a specified time period.

### Audio

**Constructor and Properties:**
- `Audio(url)`: Creates an audio object that can be played, paused, and stopped.
    - `url`: Source URL of the audio file.

**Methods:**
- `play(from)`: Plays the audio from the specified timestamp.
- `pause()`: Pauses the audio.
- `stop()`: Stops and resets the audio.
  
### Equations

**Constructor and Properties:**
- `Equation(equationPoints, expression, at, width, color, fontSize)`: Creates an equation object that renders mathematical expressions.
  - `equationPoints`: Array of points that make up the curves for equation rendering.
  - `expression`: LaTeX or similar markup representing the mathematical expression.
  - `at`: Object specifying `x`, `y`, and optional `z` coordinates where the expression starts.
  - `width`: The width of the rendered expression.
  - `color`: String representing the color of the expression.
  - `fontSize`: Size of the font used in rendering the expression.

**Methods:**
- `show(inSeconds)`: Shows the rendered equation over the specified time period.
- `hide(inSeconds)`: Hides the rendered equation over the specified time period.

### Vector Images

**Constructor and Properties:**
- `VectorImage(url, at, color, fillcolor, width)`: Creates a vector image object from an SVG file.
  - `url`: URL to the SVG file.
  - `at`: Object specifying `x`, `y`, and optional `z` coordinates for the top-left corner of the image.
  - `color`: String representing the stroke color of paths in the SVG.
  - `fillcolor`: String representing the fill color of shapes in the SVG.
  - `width`: The width of the rendered image relative to the space's units.

**Methods:**
- `show(inSeconds)`: Shows the vector image over the specified time period.
- `hide(inSeconds)`: Hides the vector image over the specified time period.
- `draw(inSeconds)`: Draws the vector image stroke by stroke over the specified time period.

### Animations

**Constructor and Properties:**
- `Animation(start, end, duration, fps, animateImmediately, animOptions, type)`: Defines an animation for an object's properties over time.
  - `start`: The animation's start time.
  - `end`: The animation's end time.
  - `duration`: The duration over which the animation occurs.
  - `fps`: Frames per second for the animation.
  - `animateImmediately`: Whether the next animation in a sequence should start immediately.
  - `animOptions`: Additional options for the animation such as keyframes.
  - `type`: Type of animation (viewX, HTML/CSS style, audio).

**Methods:**
- `startNextImmediately()`: Starts the next animation in the sequence immediately.

### AnimationGroup

**Constructor and Properties:**
- `AnimationGroup()`: A container for a group of animations that can be controlled together.

**Methods:**
- `addAnim(animation)`: Adds an animation to the group.
- `startNextImmediately()`: Sets the group to start the next animation immediately after the current one finishes.

### Utility Functions

**General Utility Functions:**
- `runFunction(func, inSeconds)`: Runs a custom function as part of an animation at a certain point in time.
- `wait(forSeconds)`: Delays the next animation by a specified number of seconds.
- `hideShowTagGroup(type, tag, inSeconds)`: Helper function to hide or show a group of elements with the same tag.

### Miscellaneous

- To remove all elements with a specific tag, use `removeElementsWithTag(tag)` or its alias `deleteElementsWithTag(tag)`.
- To retrieve parts 1 and 2 of the documentation or other specific sections, you can refer to specific prompts or the index of the full documentation.
