var rhyform = (function() {

    // Geometry and ordinary text work without optional MathJax.
    function typesetIfReady(elements) {
        if (typeof MathJax !== 'undefined' && typeof MathJax.typeset === 'function') MathJax.typeset(elements);
    }

    // Constructors and their associated methods

    defaultSpaceBounds = {
        xmax: 11,
        xmin: -11,

        ymax: 11,
        ymin: -11,

        axislocationX: 0,
        axislocationY: 0,

        xaxislabelvisibility: 'no',
        yaxislabelvisibility: 'no',

        xaxisvisibility: 'no',
        yaxisvisibility: 'no',

        xmajorgridlabelvisibility: 'no',
        ymajorgridlabelvisibility: 'no',

        xmajorgridlinesvisibility: 'no',
        ymajorgridlinesvisibility: 'no',

        fontSize: 1.6,

        unitAspectRatio: 'yes',
        fixAxisStretchCentrally: 'yes',

        scrollZoom: "no",

        position: 'relative',
    }


    function containsOnlyText(element) {
        for (var i = 0; i < element.childNodes.length; i++) {
            if (element.childNodes[i].nodeType !== 3) {
                return false;
            }
        }
        return true;
    }


    function showElement(element, inSeconds=1) {

        animationOptions = {}
        animationOptions.keyframes = {}
        animationOptions.keyframes["0"] = {}
        animationOptions.keyframes[inSeconds.toString()] = {}

        animationOptions.elementsAndPropertiesInvolved = {}

        if (element instanceof Point || element instanceof Line || element instanceof Curve || element instanceof Circle) {

            if (element instanceof Point) {
                element.updatePointRender();
            }

            animationOptions.keyframes["0"][element.name] = {
                'graph': element.space.name + "-graph",
                'object': element.name,
                'options': { opacity: 0}
            }

            animationOptions.keyframes[inSeconds.toString()][element.name] = {
                'graph': element.space.name + "-graph",
                'object': element.name,
                'options': { opacity: 1}
            }

            animationOptions.elementsAndPropertiesInvolved[element.name] = {
                element: element,
                properties: ['opacity']
            }

            anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
            return anim;

        } else if (element instanceof Text || element instanceof Button || element instanceof ValueSlider) {

            htmlAnimationOptions = {
                "propertiesAtStart": {
                    "opacity": 0,
                },
                "propertiesAtEnd": {
                    "opacity": 1,
                },
                "element": element.element,
            }


            htmlAnimationOptions.elementsAndPropertiesInvolved = {}

            htmlAnimationOptions.elementsAndPropertiesInvolved[element.name] = {
                element: element,
                properties: ['opacity']
            }


            anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=htmlAnimationOptions, type="html-css-style")
            return anim;
        } else {
            return null;
        }


    }

    function hideElement(element, inSeconds=1) {

        animationOptions = {}
        animationOptions.keyframes = {}
        animationOptions.keyframes["0"] = {}
        animationOptions.keyframes[inSeconds.toString()] = {}

        animationOptions.elementsAndPropertiesInvolved = {}

        if (element instanceof Point || element instanceof Line || element instanceof Curve || element instanceof Circle) {

            animationOptions.keyframes["0"][element.name] = {
                'graph': element.space.name + "-graph",
                'object': element.name,
                'options': { opacity: 1}
            }

            animationOptions.keyframes[inSeconds.toString()][element.name] = {
                'graph': element.space.name + "-graph",
                'object': element.name,
                'options': { opacity: 0}
            }

            animationOptions.elementsAndPropertiesInvolved[element.name] = {
                element: element,
                properties: ['opacity']
            }


            anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
            return anim;

        } else if (element instanceof Text || element instanceof Button || element instanceof ValueSlider) {

            htmlAnimationOptions = {
                "propertiesAtStart": {
                    "opacity": 1,
                },
                "propertiesAtEnd": {
                    "opacity": 0,
                },
                "element": element.element,
            }

            htmlAnimationOptions.elementsAndPropertiesInvolved = {}

            htmlAnimationOptions.elementsAndPropertiesInvolved[element.name] = {
                element: element,
                properties: ['opacity']
            }


            anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=htmlAnimationOptions, type="html-css-style")
            return anim;
        } else {
            return null;
        }


    }

    function moveToTopViewX(viewXElement) {
        // viewX.moveToTop(graphname, elementname)

        // element: viewXElement.name
        // graph: viewXElement.space.name + "-graph"

        viewX.moveToTop(viewXElement.space.name + "-graph", viewXElement.name)
    }


    function changeViewXProperties(element, propertiesAndValuesBefore, propertiesAndValuesAfter, inSeconds=1) {
        animationOptions = {}
        animationOptions.keyframes = {}
        animationOptions.keyframes["0"] = {}
        animationOptions.keyframes[inSeconds.toString()] = {}

        if (element instanceof Point || element instanceof Line || element instanceof Curve || element instanceof Circle) {


            animationOptions.keyframes["0"][element.name] = {
                'graph': element.space.name + "-graph",
                'object': element.name
            }

            animationOptions.keyframes["0"][element.name]["options"] = propertiesAndValuesBefore

            animationOptions.keyframes[inSeconds.toString()][element.name] = {
                'graph': element.space.name + "-graph",
                'object': element.name
            }

            animationOptions.keyframes[inSeconds.toString()][element.name]["options"] = propertiesAndValuesAfter;

            props = Object.keys(propertiesAndValuesBefore);

            animationOptions.elementsAndPropertiesInvolved = {}

            animationOptions.elementsAndPropertiesInvolved[element.name] = {
                element: element,
                properties: props
            }

            // console.log(animationOptions)

            anim = new Animation(0, inSeconds, inSeconds, 60, animateImmediately = false, animOptions=animationOptions)
            return anim;

        }
    }

    function updateViewXProperties(element, properties) {
        propertiesToSet = []
        if (element instanceof Point || element instanceof Line || element instanceof Curve || element instanceof Circle) {
            propertyToSet = {
                'graphName': element.space.name + "-graph",
                'objectName': element.name,
                'properties': properties
            }
            viewX.updateObjects([propertyToSet])
        }


    }


    function changeHTMLProperties(element, propertiesAndValuesBefore, propertiesAndValuesAfter, inSeconds=1) {

        animationOptions = {}
        animationOptions.keyframes = {}
        animationOptions.keyframes["0"] = {}
        animationOptions.keyframes[inSeconds.toString()] = {}



        htmlAnimationOptions = {}

        htmlAnimationOptions.propertiesAtStart = propertiesAndValuesBefore;
        htmlAnimationOptions.propertiesAtEnd = propertiesAndValuesAfter;
        htmlAnimationOptions.element = element.element;

        htmlAnimationOptions.elementsAndPropertiesInvolved = {}

        htmlAnimationOptions.elementsAndPropertiesInvolved[element.name] = {
            element: element,
            properties: Object.keys(propertiesAndValuesBefore)
        }


        anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=htmlAnimationOptions, type="html-css-style")
        return anim;
    }













    function manageTags(tagName, object, action) {
        if (action === 'add') {
            // Add the tag if it doesn't exist
            if (object.tags.indexOf(tagName) === -1) {
                object.tags.push(tagName);
                // Update the global tag registry
                if (rhyform && rhyform.tags) {
                    rhyform.tags[tagName] = rhyform.tags[tagName] || [];
                    rhyform.tags[tagName].push(object);
                }
            }
        } else if (action === 'remove') {
            // Remove the tag if it exists
            var index = object.tags.indexOf(tagName);
            if (index !== -1) {
                object.tags.splice(index, 1);
                // Update the global tag registry
                if (rhyform && rhyform.tags && rhyform.tags[tagName]) {
                    var tagIndex = rhyform.tags[tagName].indexOf(object);
                    if (tagIndex !== -1) {
                        rhyform.tags[tagName].splice(tagIndex, 1);
                    }
                }
            }
        }

        return object;
    }








    function Camera(name = "camera", atElement=null) {
        this.name = name;
        this.bounds = {
            x: defaultSpaceBounds.xmin,
            y: defaultSpaceBounds.ymin,
            width: defaultSpaceBounds.xmax - defaultSpaceBounds.xmin,
            height: defaultSpaceBounds.ymax - defaultSpaceBounds.ymin,
        }

        this.atElement = atElement;

        this.space = null;

        this.pixelsPerUnit = this.atElement.clientWidth/this.bounds.width

        this.labelDistance = this.bounds.width*12/this.atElement.clientWidth;

        this.setBounds = function(newBounds) {
            this.bounds = newBounds;
            this.pixelsPerUnit = this.atElement.clientWidth/this.bounds.width
            this.labelDistance = this.bounds.width*12/this.atElement.clientWidth;

            camBounds = rhyform.libraryFunctions.convertBoundsToViewXBounds(this.bounds)
            viewX.updateGraphZoom(this.space.svgGraph.name, camBounds)
        }
    }

    function Space(spaceName = "space", inElement="body") {

        this.name = spaceName;
        this.element = document.createElement("space");
        this.element.setAttribute("name", spaceName);

        this.svgLayer = document.createElement("div");
        this.svgLayer.setAttribute("id", spaceName + "-svg-layer");


        this.element.style.position = 'relative';
        this.element.style.display = 'block';
        this.element.style.width = '100%';

        this.svgLayer.style.position = 'relative';
        this.svgLayer.style.width = '100%';

        this.htmlLayer = document.createElement("div");
        this.htmlLayer.setAttribute("id", spaceName + "-html-layer");
        this.htmlLayer.style.position = 'absolute';
        this.htmlLayer.style.width = '100%';
        this.htmlLayer.style.height = '100%';
        this.htmlLayer.style.zIndex = '3';

        this.element.appendChild(this.htmlLayer);
        this.element.appendChild(this.svgLayer);
        document.querySelector(inElement).appendChild(this.element);

        this.svgGraph = viewX.addGraph(this.svgLayer, spaceName + "-graph", defaultSpaceBounds)

        this.camera = new Camera(name = "mainCamera", atElement=this.element);

        this.camera.space = this;

        camBounds = rhyform.libraryFunctions.convertBoundsToViewXBounds(this.camera.bounds)
        viewX.updateGraphZoom(this.svgGraph.name, camBounds)


    }

    function Scene(sceneName) {
        this.name = sceneName;
        this.selectedSpace = null;
        this.animations = {};
        this.animationAdditionIndex = 0;
        this.animatingElementsAndProperties = {};
        this.audioAdditionIndex = 0;

        rhyform.selectActiveScene(this);


        installTimeline(this, viewX, rhyform);

        this.createSeekBar = function() {

            // const defaults = {
            //     at: {x: 0, y: 0, z: 0},
            //     width: 5,
            //     min: 0,
            //     max: 100,
            //     value: 50,
            //     step: 1,
            //     sliderProperties: {
            //         onChange: function(){ console.log("Slider value changed"); },
            //         color: "white",
            //         thickness: 0.2,
            //         isAlwaysVisible: false,
            //         backgroundType: 'glassy',
            //         borderColor: 'hsla(0, 0%, 50%, 0.1)'
            //     },
            //     valueDisplayProperties: {
            //         color: "white",
            //         fontSize: "xxx-large",
            //         font: "Gaegu"
            //     },
            //     labelTextProperties: {
            //         color: "hsla(0, 0%, 70%, 1)",
            //         fontSize: 'auto',
            //         font: "Gaegu",
            //         text: "Temperature"
            //     },
            //     labelDescriptionProperties: {
            //         color: "hsla(0, 0%, 40%, 1)",
            //         fontSize: 'small',
            //         font: "Gaegu",
            //         text: "The value represents the change in some quantity that is important to this visualization. Maybe it's the number of people in a room, or the amount of money in a bank account or number of stars in a galaxy ⭐️."
            //     }
            // };

            sliderOptions = {
                at: {x: -8, y: -8},
                min: 0,
                max: Object.keys(this.animations).length,
                value: this.animationAdditionIndex,
                width: 17,
                step: 1,
                labelTextProperties: {
                    text: '',
                },
                labelDescriptionProperties: {
                    text: '',
                },
                valueDisplayProperties: {
                    fontSize: 'medium',
                    color: 'grey'
                },
                sliderProperties: {
                    forScene: this,
                    onChange: async function() {
                        if (this.forScene.resetting == false || this.forScene.resetting == undefined) {

                            this.forScene.pause();
                            // this.forScene.animationIndex = this.forScene.seekBar.value - 1;
                            if (this.forScene.seekBar.value > 1) {
                                this.forScene.resetToFrame(this.forScene.seekBar.value - 1);
                                this.forScene.playAnimation(this.forScene.seekBar.value - 1);
                            }
                            else if (this.forScene.seekBar.value == 1) {
                                this.forScene.resetToFrame(0);
                                this.forScene.playAnimation(0);

                            }
                        }
                    },
                    valueTransformToText: function(value) {

                        // seconds to hours, minutes, seconds


                        hours = Math.floor(this.forScene.seekBar.timeOfAnimation/3600);
                        minutes = Math.floor((this.forScene.seekBar.timeOfAnimation - hours*3600)/60);
                        seconds = this.forScene.seekBar.timeOfAnimation - hours*3600 - minutes*60;

                        if (hours < 10) {
                            hours = "0" + hours.toString();
                        }
                        if (minutes < 10) {
                            minutes = "0" + minutes.toString();
                        }

                        if (seconds < 10) {
                            seconds = "0" + seconds.toFixed(1).toString();
                        }
                        else {
                            seconds = seconds.toFixed(1).toString();
                        }
                        finalString = ""

                        if (hours != "00") {
                            finalString += hours + ":";
                        }

                        finalString += minutes + ":" + seconds;


                        // console.log(hours, minutes, seconds)

                        return finalString;
                    },
                    isAlwaysVisible: true,
                    borderColor: 'transparent',
                    thickness: 2,
                    backgroundType: 'none',
                    trackColor: 'hsla(198, 0%, 10%, 0.1)',
                    trackFillColor: 'hsla(198, 70%, 30%, 0.5)',
                    thumbSize: 10,
                    thumbColor: 'hsla(198, 30%, 70%, 1)',
                }
            }





            this.seekBar = rhyform.createSlider(sliderOptions);
            this.seekBar.scene = this;

            return this.seekBar;
        }

        this.getElementsInvolved = function() {
            return rhyform.tags["<scene>" + this.name] || [];
        }


    }



    Scene.prototype.selectSpace = function(space) {
        this.selectedSpace = space;
    };


    function Point(at={x:0, y:0, z:0}, size=0.5, color="white") {
        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.coordinates = Object.assign({x: 0, y: 0, z: 0}, at);

        this.space = rhyform.activeScene.selectedSpace;
        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)
        this.name = "point-" + rhyform.objectAdditionIndex;
        this.size = size;
        this.color = color;

        this.seen = false;


        this.bounds = {
            xmin: this.coordinates.x,
            xmax: this.coordinates.x,
            ymin: this.coordinates.y,
            ymax: this.coordinates.y,
            zmin: this.coordinates.z,
            zmax: this.coordinates.z,
        }

        this.bounds.center = {
            x: this.coordinates.x,
            y: this.coordinates.y,
            z: this.coordinates.z,
        }

        this.added = false;
        this.element = null;

        this.createBasicPoint = function() {
            if (!this.added) {
                addingPointData = {x:this.coordinates.x, y:this.coordinates.y, pointsize: this.size, pointcolor: this.color, opacity: 0}
                addingPoint = viewX.addPoint(this.space.name + "-graph", this.name, addingPointData)

                this.added = true;
                this.element = addingPoint;
            }
        }

        this.updatePointRender = function() {

            if (this.seen) {
                if (!this.added) {
                    this.createBasicPoint()
                }

                addingPointData = {x:this.coordinates.x, y:this.coordinates.y, pointsize: this.size, pointcolor: this.color}
                updatingPoint = viewX.updatePointXY(this.space.name + "-graph", this.name, this.coordinates.x, this.coordinates.y)
                updatingPoint = viewX.updatePoint(this.space.name + "-graph", this.name, addingPointData)
            }

            // this.element = updatingPoint;
        }



        // this.createBasicPoint()

        rhyform.objectAdditionIndex += 1;


        this.show = function(inSeconds=1) {

            this.seen = true;
            this.createBasicPoint();
            theAnim = showElement(this, inSeconds);
            return theAnim;
        }

        this.hide = function(inSeconds=1) {

            this.seen = false;

            this.createBasicPoint();
            theAnim = hideElement(this, inSeconds);
            return theAnim;
        }

        this.place = {

            at: (x=0, y=0, z=0) => {
                this.coordinates = {x: x, y: y, z: z};
                this.bounds = {
                    xmin: this.coordinates.x,
                    xmax: this.coordinates.x,
                    ymin: this.coordinates.y,
                    ymax: this.coordinates.y,
                    zmin: this.coordinates.z,
                    zmax: this.coordinates.z,
                }

                this.bounds.center = {
                    x: this.coordinates.x,
                    y: this.coordinates.y,
                    z: this.coordinates.z,
                }

                this.updatePointRender();
                return this;
            },

            nextTo: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                this.coordinates.y = element.bounds.ymin - atDistance;
                this.coordinates.x = element.bounds.xmax + atDistance;
                this.updatePointRender();
                return this;
            },

            above: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                this.coordinates.y = element.bounds.ymax + atDistance;
                this.coordinates.x = element.bounds.center.x;
                this.updatePointRender();
                return this;
            },

            below: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }




                this.coordinates.y = element.bounds.ymin - atDistance;
                this.coordinates.x = element.bounds.center.x;

                this.bounds = {
                    xmin: this.coordinates.x,
                    xmax: this.coordinates.x,
                    ymin: this.coordinates.y,
                    ymax: this.coordinates.y,
                    zmin: this.coordinates.z,
                    zmax: this.coordinates.z,
                }

                this.bounds.center = {
                    x: this.coordinates.x,
                    y: this.coordinates.y,
                    z: this.coordinates.z,
                }

                this.updatePointRender();
                return this;
            },

            leftOf: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                this.coordinates.y = element.bounds.center.y;
                this.coordinates.x = element.bounds.xmin - atDistance;
                this.updatePointRender();
                return this;
            },

            rightOf: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                this.coordinates.y = element.bounds.center.y;
                this.coordinates.x = element.bounds.xmax + atDistance;
                this.updatePointRender();
                return this;
            },
        };

        this.loadWith = {
            size: (size) => {
                this.size = size;
                return this;
            },

            color: (color) => {
                this.color = color;
                return this;
            },

            position: (x=0, y=0, z= 0) => {
                this.coordinates = {x: x, y: y, z: z};

                this.bounds = {
                    xmin: this.coordinates.x,
                    xmax: this.coordinates.x,
                    ymin: this.coordinates.y,
                    ymax: this.coordinates.y,
                    zmin: this.coordinates.z,
                    zmax: this.coordinates.z,
                }

                this.bounds.center = {
                    x: this.coordinates.x,
                    y: this.coordinates.y,
                    z: this.coordinates.z,
                }

                return this;
            }
        };

        this.set = {
            size: (size) => {
                this.createBasicPoint();
                updateViewXProperties(this, {pointsize: size});
                this.size = size;
                return this;
            },

            color: (color) => {
                this.createBasicPoint();
                updateViewXProperties(this, {pointcolor: color});
                this.color = color;
                return this;
            },

            position: (x=0, y=0, z= 0) => {
                this.createBasicPoint();
                updateViewXProperties(this, {x: x, y: y});
                this.place.at(x, y, z);
                return this;
            },

            opacity: (opacity) => {
                this.createBasicPoint();
                updateViewXProperties(this, {opacity: opacity});

                this.opacity = opacity;
                // console.log(this.opacity)
                return this;
            }
        }

        this.change = {
            size: (size, inSeconds=1) => {
                this.createBasicPoint();
                theAnim = changeViewXProperties(this, {pointsize: this.size}, {pointsize: size}, inSeconds);
                this.size = size;
                return theAnim;
            },

            color: (color, inSeconds=1) => {
                this.createBasicPoint();
                theAnim = changeViewXProperties(this, {pointcolor: this.color}, {pointcolor: color}, inSeconds);
                this.color = color;
                return theAnim;
            },

            position: (coordinates, inSeconds=1) => {
                this.createBasicPoint();
                theAnim = changeViewXProperties(this, {x: this.coordinates.x, y: this.coordinates.y}, {x: coordinates.x, y: coordinates.y}, inSeconds);

                this.coordinates = Object.assign({z: 0}, coordinates);
                this.bounds = {xmin: coordinates.x, xmax: coordinates.x, ymin: coordinates.y, ymax: coordinates.y, zmin: this.coordinates.z, zmax: this.coordinates.z, center: {...this.coordinates}};
                return theAnim;
            }

        };


        this.moveToTop = function() {
            moveToTopViewX(this);
        }

        this.remove = function() {
            viewX.removePoint(this.space.name + "-graph", this.name);
        }

        this.duplicate = function() {
            return new Point(this.coordinates, this.size, this.color);
        }


    }

    function Text(content) {
        this.content = content;
        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)

        this.added = false;
        this.element = null;

        this.coordinates = {
            x: 0,
            y: 0,
        };

        this.space = rhyform.activeScene.selectedSpace;
        this.name = "text-" + rhyform.objectAdditionIndex;
        this.color = "white";
        this.font = rhyform.font;
        this.fontSize = rhyform.fontSize;
        this.width = 3;
        this.height = 0;
        this.textAlign = "left";

        this.findBounds = function() {

            this.bounds = {
                xmin: this.coordinates.x,
                xmax: this.coordinates.x + this.width,
                ymin: this.coordinates.y - this.height,
                ymax: this.coordinates.y,
                zmin: this.coordinates.z,
                zmax: this.coordinates.z,
            }

            this.bounds.center = {
                x: this.coordinates.x + this.width/2,
                y: this.coordinates.y - this.height/2,
                z: this.coordinates.z,
            }
        }

        this.findBounds();


        rhyform.objectAdditionIndex += 1;

        this.createBasicText = function() {
            if (!this.added) {
                var textDiv = document.createElement("div");
                textDiv.innerHTML = this.content;
                textDiv.style.position = "absolute";
                textDiv.style.color = this.color;
                textDiv.style.fontFamily = this.font;
                textDiv.style.fontSize = this.fontSize;
                textDiv.style.pointerEvents = "none";

                htmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)

                textDiv.style.left = htmlCoordinates.x + "px";
                textDiv.style.top = htmlCoordinates.y + "px";

                textDiv.style.width = this.width*this.space.camera.pixelsPerUnit + "px";
                textDiv.style.textAlign = this.textAlign;

                document.getElementById(this.space.name + "-html-layer").appendChild(textDiv);
                textDiv.style.opacity = 0;

                typesetIfReady([textDiv])
                let nodes = textDiv.childNodes;

                for (let node of nodes) {
                    if (node.nodeType == 3) {
                        var span = document.createElement('span');
                        textDiv.insertBefore(span, node);

                        span.appendChild(node);
                    }
                }

                this.nodes = textDiv.childNodes;

                this.added = true;
                this.element = textDiv;

                this.height = textDiv.clientHeight/this.space.camera.pixelsPerUnit;
                this.findBounds();

            }
        }

        this.placeAtCoordinates = function() {
            htmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)

            this.element.style.left = htmlCoordinates.x + "px";
            this.element.style.top = htmlCoordinates.y + "px";
        }

        this.createBasicText()

        this.updateBasicText = function() {
            textDiv = this.element;
            textDiv.innerHTML = this.content;
            textDiv.style.position = "absolute";
            textDiv.style.color = this.color;
            textDiv.style.fontFamily = this.font;
            textDiv.style.fontSize = this.fontSize;
            textDiv.style.pointerEvents = "none";

            htmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)

            textDiv.style.left = htmlCoordinates.x + "px";
            textDiv.style.top = htmlCoordinates.y + "px";

            textDiv.style.width = this.width*this.space.camera.pixelsPerUnit + "px";
            textDiv.style.textAlign = this.textAlign;

            document.getElementById(this.space.name + "-html-layer").appendChild(textDiv);
            textDiv.style.opacity = 0;

            typesetIfReady([textDiv])
            let nodes = textDiv.childNodes;

            for (let node of nodes) {
                if (node.nodeType == 3) {
                    var span = document.createElement('span');
                    textDiv.insertBefore(span, node);

                    span.appendChild(node);
                }
            }

            this.nodes = textDiv.childNodes;

            this.added = true;
            this.element = textDiv;

            this.height = textDiv.clientHeight/this.space.camera.pixelsPerUnit;
            this.findBounds();
        }

        this.change = {
            color: (color, inSeconds=1) => {
                this.createBasicText();
                theAnim = changeHTMLProperties(this, {color: this.color}, {color: color}, inSeconds);
                this.color = color;
                return theAnim;
            },

            content: (content, inSeconds=1) => {
                this.content = content;

                htmlAnimationOptions = {
                    "text": this.content,
                    "speed": 1,
                    "element": this.element,
                }

                animationDurationFactor = inSeconds

                htmlAnimationOptions.elementsAndPropertiesInvolved = {}

                htmlAnimationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["content"]
                }

                anim = new Animation(0, animationDurationFactor, animationDurationFactor, 50, animateImmediately = false, animOptions=htmlAnimationOptions, type="inner-html")


                return anim;
            },

            place: {
                to: (coordinates, inSeconds=1) => {
                    this.createBasicText();
                    oldHtmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)

                    this.coordinates = coordinates;
                    htmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)
                    theAnim = changeHTMLProperties(this, {top: oldHtmlCoordinates.y + "px", left: oldHtmlCoordinates.x + "px"}, {top: htmlCoordinates.y + "px", left: htmlCoordinates.x + "px"}, inSeconds);

                    return theAnim;
                },

                below: (element, atDistance, inSeconds=1) => {
                    if (atDistance === undefined) {
                        atDistance = this.space.camera.labelDistance;
                    }

                    this.findHeightAndBounds(element);

                    this.coordinates.y = element.bounds.ymin - atDistance;
                    this.coordinates.x = element.bounds.center.x;

                    if (element instanceof Text) {
                        this.coordinates.x = element.bounds.xmin;
                    }


                    this.createBasicText();
                    oldHtmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)

                    htmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)
                    theAnim = changeHTMLProperties(this, {top: oldHtmlCoordinates.y + "px", left: oldHtmlCoordinates.x + "px"}, {top: htmlCoordinates.y + "px", left: htmlCoordinates.x + "px"}, inSeconds);

                    return theAnim;




                    this.placeAtCoordinates();
                    return this;
                }
            }
        }



        this.findHeightAndBounds = function(element) {
            if (element instanceof Text) {
                element.height = element.element.clientHeight/this.space.camera.pixelsPerUnit;
                element.findBounds();
            }

            if (this instanceof Text) {
                this.height = this.element.clientHeight/this.space.camera.pixelsPerUnit;
                this.findBounds();
            }
        }

        this.place = {

            at: (x=0, y=0, z=0) => {
                this.coordinates = {x: x, y: y, z: z};


                this.placeAtCoordinates();
                return this;
            },

            nextTo: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }

                this.findHeightAndBounds(element);
                this.coordinates.y = element.bounds.ymin - atDistance;
                this.coordinates.x = element.bounds.xmax + atDistance;

                this.placeAtCoordinates();
                return this;
            },

            above: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                this.findHeightAndBounds(element);

                this.coordinates.y = element.bounds.ymax + atDistance;
                this.coordinates.x = element.bounds.center.x;

                if (element instanceof Text) {
                    this.coordinates.x = element.bounds.xmin;
                }

                this.placeAtCoordinates();
                return this;
            },

            below: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }

                this.findHeightAndBounds(element);

                this.coordinates.y = element.bounds.ymin - atDistance;

                if (element instanceof Text) {
                    this.coordinates.x = element.bounds.xmin;
                }
                else {
                    this.coordinates.x = element.bounds.center.x;
                }

                this.placeAtCoordinates();
                return this;
            },

            leftOf: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                this.findHeightAndBounds(element);

                this.coordinates.y = element.bounds.center.y;
                this.coordinates.x = element.bounds.xmin - atDistance;
                this.placeAtCoordinates();
                return this;
            },

            rightOf: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }

                this.findHeightAndBounds(element);

                this.coordinates.y = element.bounds.center.y;
                this.coordinates.x = element.bounds.xmax + atDistance;
                this.placeAtCoordinates();
                return this;
            },
        };

        this.loadWith = {
            fontSize: (fontSize) => {
                this.fontSize = fontSize;
                this.element.style.fontSize = this.fontSize;
                return this;
            },

            font: (font) => {
                this.font = font;
                this.element.style.fontFamily = this.font;
                return this;
            },

            color: (color) => {
                if (color instanceof Gradient) {
                    this.element.classList.add("rhyform-gradient-text");
                    this.element.style.backgroundImage = color.cssString;
                    this.color = color;
                }
                else {
                    this.color = color;
                    this.element.style.color = this.color;
                }
                return this;
            },

            width: (width) => {
                this.width = width;
                this.element.style.width = this.width*this.space.camera.pixelsPerUnit + "px";
                return this;
            },

            content: (content) => {
                this.content = content;
                this.element.innerHTML = this.content;
                return this;
            },

            textAlign: (textAlign) => {
                this.textAlign = textAlign;
                this.element.style.textAlign = this.textAlign;
                return this;
            },

            opacity: (opacity) => {
                this.opacity = opacity;
                this.element.style.opacity = this.opacity;
                return this;
            }
        };

        this.set = this.loadWith;


        this.write = function(lettersPerSecond=20) {

            animGroup = new AnimationGroup()

             if (this instanceof Text) {

                for (let node of this.nodes) {
                    if (containsOnlyText(node)) {
                        htmlAnimationOptions = {
                            "text": "",
                            "speed": lettersPerSecond,
                            "element": node
                        }

                        htmlAnimationOptions.elementsAndPropertiesInvolved = {}
                        htmlAnimationOptions.elementsAndPropertiesInvolved[this.name] = {
                            element: this,
                            properties: ["content"]
                        }

                        anim = new Animation(0, 0, 0, 30, animateImmediately = false, animOptions=htmlAnimationOptions, type="inner-html")
                        animGroup.addAnim(anim)
                    }
                    else {

                        htmlAnimationOptions = {
                            "propertiesAtStart": {
                                "opacity": 0,
                            },
                            "propertiesAtEnd": {
                                "opacity": 0,
                            },
                            "element": node,
                        }

                        htmlAnimationOptions.elementsAndPropertiesInvolved = {}
                        htmlAnimationOptions.elementsAndPropertiesInvolved[this.name] = {
                            element: this,
                            properties: ["content"]
                        }

                        anim = new Animation(0, 0, 0, 30, animateImmediately = false, animOptions=htmlAnimationOptions, type="html-css-style")
                        animGroup.addAnim(anim)
                    }
                }

                htmlAnimationOptions = {
                    "propertiesAtStart": {
                        "opacity": 0,
                    },
                    "propertiesAtEnd": {
                        "opacity": 1,
                    },
                    "element": this.element,
                }

                htmlAnimationOptions.elementsAndPropertiesInvolved = {}
                htmlAnimationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["content"]
                }

                anim = new Animation(0, 0, 0, 30, animateImmediately = false, animOptions=htmlAnimationOptions, type="html-css-style")
                animGroup.addAnim(anim)

                for (let node of this.nodes) {
                    if (containsOnlyText(node)) {
                        for (let i = 0; i < node.textContent.length; i++) {

                            textSubString = node.textContent.substring(0, i+1)

                            htmlAnimationOptions = {
                                "text": textSubString,
                                "speed": lettersPerSecond,
                                "element": node
                            }

                            animationDurationFactor = (1/lettersPerSecond)

                            htmlAnimationOptions.elementsAndPropertiesInvolved = {}

                            htmlAnimationOptions.elementsAndPropertiesInvolved[this.name] = {
                                element: this,
                                properties: ["content"]
                            }

                            anim = new Animation(0, animationDurationFactor, animationDurationFactor, 50, animateImmediately = false, animOptions=htmlAnimationOptions, type="inner-html")
                            animGroup.addAnim(anim)
                        }
                    }
                    else {
                        htmlAnimationOptions = {
                            "propertiesAtStart": {
                                "opacity": 0,
                            },
                            "propertiesAtEnd": {
                                "opacity": 1,
                            },
                            "element": node,
                        }

                        htmlAnimationOptions.elementsAndPropertiesInvolved = {}

                        htmlAnimationOptions.elementsAndPropertiesInvolved[this.name] = {
                            element: this,
                            properties: ["content"]
                        }

                        anim = new Animation(0, 0.2, 0.2, 30, animateImmediately = false, animOptions=htmlAnimationOptions, type="html-css-style")
                        animGroup.addAnim(anim)
                    }
                }

                return animGroup;
            } else {
                console.log("Must be text ");
                return null;
            }


        }

        this.show = function(inSeconds=1) {
            theAnim = showElement(this, inSeconds);
            return theAnim;
        }

        this.hide = function(inSeconds=1) {
            // this.element.style.pointerEvents = "none";
            theAnim = hideElement(this, inSeconds);
            return theAnim;
        }

        this.remove = function() {

            // console.log(this.element.innerHTML)
            // remove the html element from div
            if (this.element.parentNode != null) {
                this.element.outerHTML = "";
            }
            else {
                this.element.remove();
            }
            // this.element.parentNode.removeChild(this.element);
            // console.log(this.element)

        }


        this.duplicate = function() {
            newText = new Text(this.content);
            newText.color = this.color;
            newText.font = this.font;
            newText.fontSize = this.fontSize;
            newText.width = this.width;
            newText.height = this.height;
            newText.textAlign = this.textAlign;
            newText.coordinates = this.coordinates;
            newText.findBounds();
            newText.createBasicText();
            newText.updateBasicText();
            return newText;
        }


    }

    function Button(content, onClick) {
        this.content = content;
        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)

        buttonText = new Text(content);
        this.textObject = buttonText;

        this.border = "2px solid hsla(0, 0%, 30%, 0.2)";
        this.borderRadius = "8px";


        // this.borderGradient = new Gradient(at=[{color: "hsla(198, 100%, 70%,0.8)", position: 0}, {color: "hsla(320, 100%, 30%, 0.2)", position: 1}], direction="horizontal");


        // this.borderImage = this.borderGradient.cssString + " 1 1 stretch";

        this.element = this.textObject.element;
        this.element.style.cursor = "pointer";
        this.element.style.userSelect = "none";
        this.element.style.webkitUserSelect = "none";
        this.element.style.mozUserSelect = "none";
        this.element.style.msUserSelect = "none";
        this.element.style.border = this.border
        this.element.style.borderRadius = this.borderRadius;
        // this.element.style.borderImage = this.borderImage;
        this.element.style.padding = "4px 4px";
        this.element.style.transition = "auto";
        this.element.style.zIndex = "4";

        // add Class
        this.element.classList.add("rhyform-button");

        this.added = false;

        this.coordinates = this.textObject.coordinates;

        this.space = rhyform.activeScene.selectedSpace;
        this.name = "button-" + rhyform.objectAdditionIndex;
        this.color = this.textObject.color;
        this.font = this.textObject.font;
        this.fontSize = this.textObject.fontSize;
        this.width = this.textObject.width;
        this.height =  this.textObject.height;
        this.textAlign = "center";

        this.textObject.loadWith.textAlign(this.textAlign);

        this.place = this.textObject.place;

        this.loadWith = this.textObject.loadWith;


        this.show = function(inSeconds=1) {
            // this.textObject.element.style.pointerEvents = "auto";
            theAnim = showElement(this.textObject, inSeconds);
            return theAnim;
        }

        this.hide = function(inSeconds=1) {
            // this.textObject.element.style.pointerEvents = "none";
            theAnim = hideElement(this.textObject, inSeconds);
            return theAnim;
        }

        this.setClick = function(onClick) {
            this.element.addEventListener("click", onClick);
        }

        this.setClick(onClick);

        this.remove = function() {
            this.textObject.remove();
        }

        this.duplicate = function() {
            newButton = new Button(this.content, onClick);
            newButton.color = this.color;
            newButton.font = this.font;
            newButton.fontSize = this.fontSize;
            newButton.width = this.width;
            newButton.height = this.height;
            newButton.textAlign = this.textAlign;
            newButton.coordinates = this.coordinates;
            newButton.findBounds();
            newButton.createBasicText();
            newButton.updateBasicText();
            return newButton;
        }

        return this;

    }


    function Gradient(at=[{color: "white", position: 0}, {color: "black", position: 1}], direction="horizontal") {
        this.at = at;
        this.direction = direction;
        this.cssString = "";

        // linear-gradient(to left top, hsla(var(--base-hue), 100%, 50%, 1), hsla(var(--secondary-hue), 100%, 50%, 1));

        if (this.direction == "horizontal") {
            this.cssString = "linear-gradient(to right";
        }

        if (this.direction == "vertical") {
            this.cssString = "linear-gradient(to bottom";
        }

        for (let colorStop of this.at) {
            this.cssString += ", " + colorStop.color + " " + colorStop.position*100 + "%";
        }

        this.cssString += ")";

        return this;
    }


    function Line(between=[point1, point2], thickness=0.5, color="white") {

        this.space = rhyform.activeScene.selectedSpace;
        this.name = "line-" + rhyform.objectAdditionIndex;
        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)

        this.point1 = between[0];
        this.point2 = between[1];


        this.bounds = {
            xmin: Math.min(this.point1.coordinates.x, this.point2.coordinates.x),
            xmax: Math.max(this.point1.coordinates.x, this.point2.coordinates.x),
            ymin: Math.min(this.point1.coordinates.y, this.point2.coordinates.y),
            ymax: Math.max(this.point1.coordinates.y, this.point2.coordinates.y),
            zmin: Math.min(this.point1.coordinates.z, this.point2.coordinates.z),
            zmax: Math.max(this.point1.coordinates.z, this.point2.coordinates.z)
        }

        this.bounds.center = {
            x: (this.bounds.xmin + this.bounds.xmax) / 2,
            y: (this.bounds.ymin + this.bounds.ymax) / 2,
            z: (this.bounds.zmin + this.bounds.zmax) / 2
        }

        this.coordinates = {
            x: this.bounds.xmax,
            y: this.bounds.ymin,
        }

        this.thickness = thickness;
        this.color = color;

        this.added = false;
        this.element = null;

        this.createBasicLine = function() {
            if (!this.added) {
                addingLineData = {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y, strokewidth: this.thickness, linecolor: this.color, opacity: 0}
                addingLine = viewX.addLine(this.space.name + "-graph", this.name, addingLineData)

                this.added = true;
                this.element = addingLine;
            }
        }

        this.updateLineRender = function() {
            if (!this.added) {
                this.createBasicLine()
            }

            updatingLineData = {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y, strokewidth: this.thickness, linecolor: this.color}
            updatingLine = viewX.updateLine(this.space.name + "-graph", this.name, updatingLineData)
        }



        this.moveToTop = function() {
            moveToTopViewX(this);
        }



        // this.createBasicLine()

        rhyform.objectAdditionIndex += 1;

        this.place = {

            between: (point1, point2) => {
                this.point1 = point1;
                this.point2 = point2;

                return this;
            },

        };

        this.show = function(inSeconds=1) {
            this.createBasicLine();
            theAnim = showElement(this, inSeconds);
            return theAnim;
        }

        this.hide = function(inSeconds=1) {
            this.createBasicLine();
            theAnim = hideElement(this, inSeconds);
            return theAnim;
        }

        this.drawFromPoint = function(point=this.point1, lengthPerSecond=1) {
            this.createBasicLine();
            if (point == this.point1 || point == this.point2) {

                distanceBetweenPoints = rhyform.libraryFunctions.distanceBetweenPoints(this.point1, this.point2)

                inSeconds = distanceBetweenPoints / lengthPerSecond

                animationOptions = {}
                animationOptions.keyframes = {}
                animationOptions.keyframes["0"] = {}
                animationOptions.keyframes[inSeconds.toString()] = {}

                animationOptions.keyframes["0"][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, x1: point.coordinates.x, y1: point.coordinates.y, x2: point.coordinates.x, y2: point.coordinates.y}
                }

                toPoint = this.point1 == point ? this.point2 : this.point1;

                animationOptions.keyframes[inSeconds.toString()][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, x1: point.coordinates.x, y1: point.coordinates.y, x2: toPoint.coordinates.x, y2: toPoint.coordinates.y}
                }

                animationOptions.elementsAndPropertiesInvolved = {}

                animationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["x1", "y1", "x2", "y2"]
                }

                anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
                return anim;

            }
        }

        this.draw = function(lengthPerSecond=1) {
            this.createBasicLine();
            point = this.point1;
            if (point == this.point1 || point == this.point2) {

                distanceBetweenPoints = rhyform.libraryFunctions.distanceBetweenPoints(this.point1, this.point2)

                inSeconds = distanceBetweenPoints / lengthPerSecond

                animationOptions = {}
                animationOptions.keyframes = {}
                animationOptions.keyframes["0"] = {}
                animationOptions.keyframes[inSeconds.toString()] = {}

                animationOptions.keyframes["0"][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, x1: point.coordinates.x, y1: point.coordinates.y, x2: point.coordinates.x, y2: point.coordinates.y}
                }

                toPoint = this.point1 == point ? this.point2 : this.point1;

                animationOptions.keyframes[inSeconds.toString()][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, x1: point.coordinates.x, y1: point.coordinates.y, x2: toPoint.coordinates.x, y2: toPoint.coordinates.y}
                }

                animationOptions.elementsAndPropertiesInvolved = {}

                animationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["x1", "y1", "x2", "y2"]
                }

                anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
                return anim;

            }
        }


        this.loadWith = {


            thickness: (thickness) => {
                this.thickness = thickness;
                this.createBasicLine();
                updatingLineData = {strokewidth: this.thickness}
                viewX.updateLine(this.space.name + "-graph", this.name, updatingLineData)
                return this;
            },

            color: (color) => {
                this.color = color;
                return this;
            },
        };

        this.change = {
            point1 : (point, inSeconds=1) => {
                animationOptions = {}
                animationOptions.keyframes = {}
                animationOptions.keyframes["0"] = {}
                animationOptions.keyframes[inSeconds.toString()] = {}

                animationOptions.keyframes["0"][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y}
                }

                this.point1 = point;

                this.bounds = {
                    xmin: Math.min(this.point1.coordinates.x, this.point2.coordinates.x),
                    xmax: Math.max(this.point1.coordinates.x, this.point2.coordinates.x),
                    ymin: Math.min(this.point1.coordinates.y, this.point2.coordinates.y),
                    ymax: Math.max(this.point1.coordinates.y, this.point2.coordinates.y),
                    zmin: Math.min(this.point1.coordinates.z, this.point2.coordinates.z),
                    zmax: Math.max(this.point1.coordinates.z, this.point2.coordinates.z)
                }

                this.bounds.center = {
                    x: (this.bounds.xmin + this.bounds.xmax) / 2,
                    y: (this.bounds.ymin + this.bounds.ymax) / 2,
                    z: (this.bounds.zmin + this.bounds.zmax) / 2
                }

                this.coordinates = {
                    x: this.bounds.xmax,
                    y: this.bounds.ymin,
                }

                animationOptions.keyframes[inSeconds.toString()][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y}
                }

                animationOptions.elementsAndPropertiesInvolved = {}

                animationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["x1", "y1", "x2", "y2"]
                }

                anim = new Animation(0, inSeconds*1.8, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
                return anim;

            },

            point2 : (point, inSeconds=1) => {
                animationOptions = {}
                animationOptions.keyframes = {}
                animationOptions.keyframes["0"] = {}
                animationOptions.keyframes[inSeconds.toString()] = {}

                animationOptions.keyframes["0"][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y}
                }

                this.point2 = point;

                this.bounds = {
                    xmin: Math.min(this.point1.coordinates.x, this.point2.coordinates.x),
                    xmax: Math.max(this.point1.coordinates.x, this.point2.coordinates.x),
                    ymin: Math.min(this.point1.coordinates.y, this.point2.coordinates.y),
                    ymax: Math.max(this.point1.coordinates.y, this.point2.coordinates.y),
                    zmin: Math.min(this.point1.coordinates.z, this.point2.coordinates.z),
                    zmax: Math.max(this.point1.coordinates.z, this.point2.coordinates.z)
                }

                this.bounds.center = {
                    x: (this.bounds.xmin + this.bounds.xmax) / 2,
                    y: (this.bounds.ymin + this.bounds.ymax) / 2,
                    z: (this.bounds.zmin + this.bounds.zmax) / 2
                }

                this.coordinates = {
                    x: this.bounds.xmax,
                    y: this.bounds.ymin,
                }

                animationOptions.keyframes[inSeconds.toString()][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y}
                }

                animationOptions.elementsAndPropertiesInvolved = {}


                animationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["x1", "y1", "x2", "y2"]
                }

                anim = new Animation(0, inSeconds*1.8, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
                return anim;

            },

            points: (point1, point2, inSeconds=1) => {
                animationOptions = {}
                animationOptions.keyframes = {}
                animationOptions.keyframes["0"] = {}
                animationOptions.keyframes[inSeconds.toString()] = {}

                animationOptions.keyframes["0"][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y}
                }

                this.point1 = point1;
                this.point2 = point2;

                this.bounds = {
                    xmin: Math.min(this.point1.coordinates.x, this.point2.coordinates.x),
                    xmax: Math.max(this.point1.coordinates.x, this.point2.coordinates.x),
                    ymin: Math.min(this.point1.coordinates.y, this.point2.coordinates.y),
                    ymax: Math.max(this.point1.coordinates.y, this.point2.coordinates.y),
                    zmin: Math.min(this.point1.coordinates.z, this.point2.coordinates.z),
                    zmax: Math.max(this.point1.coordinates.z, this.point2.coordinates.z)
                }

                this.bounds.center = {
                    x: (this.bounds.xmin + this.bounds.xmax) / 2,
                    y: (this.bounds.ymin + this.bounds.ymax) / 2,
                    z: (this.bounds.zmin + this.bounds.zmax) / 2
                }

                this.coordinates = {
                    x: this.bounds.xmax,
                    y: this.bounds.ymin,
                }

                animationOptions.keyframes[inSeconds.toString()][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': {x1:this.point1.coordinates.x, y1:this.point1.coordinates.y, x2:this.point2.coordinates.x, y2:this.point2.coordinates.y}
                }

                animationOptions.elementsAndPropertiesInvolved = {}

                animationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["x1", "y1", "x2", "y2"]
                }

                anim = new Animation(0, inSeconds*1.8, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
                return anim;
            },
        };

        this.remove = function() {
            viewX.removeLine(this.space.name + "-graph", this.name)
        }


        this.duplicate = function() {
            newLine = new Line([this.point1, this.point2]);
            newLine.color = this.color;
            newLine.thickness = this.thickness;
            newLine.createBasicLine();
            return newLine;
        }
    }

    function setCurveGeometry(curve, input) {
        if (!Array.isArray(input) || !input.length) throw new TypeError('A curve needs at least one point');
        const commands = input[0].command != null;
        curve.points = input.map(p => {
            const value = p.coordinates || (Array.isArray(p) ? {x:p[0], y:p[1]} : p);
            const coordinates = {x:svgTools.finite(value.x), y:svgTools.finite(value.y), z:svgTools.finite(value.z ?? 0)};
            if (commands) {
                if (p.command !== 'M' && p.command !== 'L') throw new Error('Legacy curves accept M/L points; use createSVG for curved paths');
                return {command:p.command, ...coordinates};
            }
            return {coordinates};
        });
        curve.pointsXY = commands ? curve.points : curve.points.map(p => [p.coordinates.x,p.coordinates.y]);
        const pts = curve.points.map(p => p.coordinates || p);
        curve.bounds = {};
        for (const key of ['x','y','z']) {
            curve.bounds[key+'min'] = Math.min(...pts.map(p=>p[key]));
            curve.bounds[key+'max'] = Math.max(...pts.map(p=>p[key]));
        }
        curve.bounds.center = {x:(curve.bounds.xmin+curve.bounds.xmax)/2,y:(curve.bounds.ymin+curve.bounds.ymax)/2,z:(curve.bounds.zmin+curve.bounds.zmax)/2};
        curve.coordinates = {x:curve.bounds.xmax,y:curve.bounds.ymin,z:curve.bounds.zmin};
    }

    function Curve(points=[], thickness=0.2, color="white", fillcolor="none") {
        if (!Array.isArray(points) || points.length === 0) throw new TypeError('A curve needs at least one point');

        this.space = rhyform.activeScene.selectedSpace;
        this.name = "curve-" + rhyform.objectAdditionIndex;
        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)

        setCurveGeometry(this, points);

        this.thickness = thickness;
        this.color = color;
        this.fillColor = fillcolor;

        this.added = false;
        this.element = null;

        this.createBasicCurve= function() {
            if (!this.added) {
                addingPathData = {points:this.pointsXY, strokewidth: this.thickness, pathcolor: this.color, opacity: 0, pathfillcolor: this.fillColor}
                addingPath = viewX.addPath(this.space.name + "-graph", this.name, addingPathData)

                this.added = true;
                this.element = addingPath;
            }
        }

        this.updateCurve= function() {
            if (this.added) {
                addingPath = viewX.updatePathPoints(this.space.name + "-graph", this.name, this.pointsXY)

                updatingPathData = {strokewidth: this.thickness, pathcolor: this.color, pathfillcolor: this.fillColor}

                updatingPath = viewX.updatePath(this.space.name + "-graph", this.name, updatingPathData)
            }
        }

        this.createBasicCurve()

        rhyform.objectAdditionIndex += 1;

        this.place = {
        };

        this.show = function(inSeconds=1) {
            this.updateCurve();
            theAnim = showElement(this, inSeconds);
            return theAnim;
        }

        this.hide = function(inSeconds=1) {
            this.updateCurve();
            theAnim = hideElement(this, inSeconds);
            return theAnim;
        }


        this.draw = function(pointsPerSecond=10) {
            if (!Number.isFinite(pointsPerSecond) || pointsPerSecond <= 0) throw new RangeError('Drawing speed must be positive');
            this.updateCurve();
            if (this.points[0].command != null) {
                distanceBetweenPoints = 0;
                for (i=0; i<this.points.length-1; i++) {
                    if (this.points[i+1].command !== 'M') distanceBetweenPoints += rhyform.libraryFunctions.distanceBetweenPoints(this.points[i], this.points[i+1])
                }

                inSeconds = distanceBetweenPoints / pointsPerSecond

                animationOptions = {}
                animationOptions.keyframes = {}
                animationOptions.keyframes["0"] = {}
                animationOptions.keyframes[inSeconds.toString()] = {}

                animStartPoints = [this.points[0]]

                animationOptions.keyframes["0"][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, points: animStartPoints}
                }

                animationOptions.keyframes[inSeconds.toString()][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, points: this.pointsXY}
                }

                animationOptions.elementsAndPropertiesInvolved = {}

                animationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["points"]
                }

                anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)
                return anim;
            }
            else {
                distanceBetweenPoints = 0;
                for (i=0; i<this.points.length-1; i++) {
                    if (this.points[i+1].command !== 'M') distanceBetweenPoints += rhyform.libraryFunctions.distanceBetweenPoints(this.points[i], this.points[i+1])
                }

                inSeconds = distanceBetweenPoints / pointsPerSecond

                animationOptions = {}
                animationOptions.keyframes = {}
                animationOptions.keyframes["0"] = {}
                animationOptions.keyframes[inSeconds.toString()] = {}


                animStartPoints = [[this.points[0].coordinates.x, this.points[0].coordinates.y]]
                if (this.points[1]) animStartPoints.push([this.points[1].coordinates.x, this.points[1].coordinates.y])


                animEndPoints = []

                for (i=0; i<this.points.length; i++) {
                    animEndPoints.push([this.points[i].coordinates.x, this.points[i].coordinates.y])
                }

                animationOptions.drawPointsSequentially = "yes"

                animationOptions.keyframes["0"][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, points: animStartPoints}
                }

                animationOptions.keyframes[inSeconds.toString()][this.name] = {
                    'graph': this.space.name + "-graph",
                    'object': this.name,
                    'options': { opacity: 1, points: animEndPoints}
                }

                // console.log(animationOptions)

                animationOptions.elementsAndPropertiesInvolved = {}

                animationOptions.elementsAndPropertiesInvolved[this.name] = {
                    element: this,
                    properties: ["points"]
                }

                anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=animationOptions)

                return anim;
            }
        }



        this.loadWith = {
            size: (thickness) => {
                this.thickness = thickness;
                return this;
            },

            color: (color) => {
                this.color = color;
                return this;
            },

            points: (points) => {
                setCurveGeometry(this, points);
                return this;
            },

            fillColor: (fillColor) => {
                this.fillColor = fillColor;
                return this;
            }
        };

        this.set = {
            points: (points) => {
                setCurveGeometry(this, points);
                this.updateCurve();
                return this;
            },

            fillColor: (fillColor) => {
                this.fillColor = fillColor;
                this.updateCurve();
                return this;
            }
        }


        this.change = {
            points: (points, inSeconds=1) => {
                const previous = this.pointsXY;
                setCurveGeometry(this, points);
                return changeViewXProperties(this, {points: previous}, {points: this.pointsXY}, inSeconds);
            },

            color: (color, inSeconds=1) => {
                theAnim = changeViewXProperties(this, {pathcolor: this.color}, {pathcolor: color}, inSeconds);
                this.color = color;
                return theAnim;
            },

            fillColor: (color, inSeconds=1) => {
                theAnim = changeViewXProperties(this, {pathfillcolor: this.fillColor}, {pathfillcolor: color}, inSeconds);
                this.fillColor = color;
                return theAnim;
            }
        }


        this.moveToTop = function() {
            moveToTopViewX(this);
        }

        this.remove = function() {
            viewX.removePath(this.space.name + "-graph", this.name)
        }


        this.duplicate = function() {
            newCurve = new Curve(this.points);
            newCurve.color = this.color;
            newCurve.thickness = this.thickness;
            newCurve.createBasicCurve();
            return newCurve;
        }
    }


    function Circle(at=point, radius=1) {
        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)


        this.coordinates = at;

        this.space = rhyform.activeScene.selectedSpace;
        this.name = "circle-" + rhyform.objectAdditionIndex;
        this.thickness = 1;
        this.color = 'violet';
        this.fillColor = 'none';
        this.radius = radius;
        this.center = at;

        this.bounds = {
            xmin: at.coordinates.x - this.radius,
            xmax: at.coordinates.x + this.radius,
            ymin: at.coordinates.y - this.radius,
            ymax: at.coordinates.y + this.radius,
            zmin: at.coordinates.z - this.radius,
            zmax: at.coordinates.z + this.radius,
        }

        this.bounds.center = {
            x: at.coordinates.x,
            y: at.coordinates.y,
            z: at.coordinates.z,
        }

        this.added = false;
        this.element = null;

        this.createBasicCircle = function() {
            if (!this.added) {
                addingCircleData = {x:this.center.coordinates.x, y:this.center.coordinates.y, radius: this.radius, circlecolor: this.fillColor, stroke: this.color, opacity: 0, strokewidth: this.thickness}
                addingCircle = viewX.addCircle(this.space.name + "-graph", this.name, addingCircleData)
                this.added = true;
                this.element = addingCircle;
            }
        }

        this.updateCircleRender = function() {

            if (this.seen) {
                if (!this.added) {
                    this.createBasicCircle()
                }

                addingCircleData = {x:this.center.coordinates.x, y:this.center.coordinates.y, radius: this.radius, circlecolor: this.fillColor, stroke: this.color, strokewidth: this.thickness}
                updatingPoint = viewX.updateCircle(this.space.name + "-graph", this.name, addingCircleData)
            }


            // this.element = updatingPoint;
        }



        // this.createBasicCircle()

        rhyform.objectAdditionIndex += 1;


        this.show = function(inSeconds=1) {
            this.createBasicCircle();
            theAnim = showElement(this, inSeconds);
            return theAnim;
        }

        this.hide = function(inSeconds=1) {
            this.createBasicCircle();
            theAnim = hideElement(this, inSeconds);
            return theAnim;
        }

        this.place = {

            at: (x=0, y=0, z=0) => {
                point = {x: x, y: y, z: z};
                this.updateCircleRender();
                return this;
            },

            nextTo: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                point.y = element.bounds.ymin - atDistance;
                point.x = element.bounds.xmax + atDistance;
                this.updateCircleRender();
                return this;
            },

            above: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                point.y = element.bounds.ymax + atDistance;
                point.x = element.bounds.center.x;
                this.updateCircleRender();
                return this;
            },

            below: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                point.y = element.bounds.ymin - atDistance;
                point.x = element.bounds.center.x;
                this.updateCircleRender();
                return this;
            },

            leftOf: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                point.y = element.bounds.center.y;
                point.x = element.bounds.xmin - atDistance;
                this.updateCircleRender();
                return this;
            },

            rightOf: (element, atDistance) => {
                if (atDistance === undefined) {
                    atDistance = this.space.camera.labelDistance;
                }
                point.y = element.bounds.center.y;
                point.x = element.bounds.xmax + atDistance;
                this.updateCircleRender();
                return this;
            },
        };

        this.loadWith = {
            thickness: (thickness) => {
                this.thickness = thickness;
                return this;
            },

            color: (color) => {
                this.color = color;
                return this;
            },

            fillColor: (color) => {
                this.fillColor = color;
                return this;
            },

            position: (x, y, z) => {
                point = {x: x, y: y, z: z};

                this.bounds = {
                    xmin: point.x - this.radius,
                    xmax: point.x + this.radius,
                    ymin: point.y - this.radius,
                    ymax: point.y + this.radius,
                    zmin: point.z - this.radius,
                    zmax: point.z + this.radius,
                }

                this.bounds.center = {
                    x: point.x,
                    y: point.y,
                    z: point.z,
                }

                return this;
            },

            radius: (radius) => {
                this.radius = radius;

                this.bounds = {
                    xmin: this.center.coordinates.x - this.radius,
                    xmax: this.center.coordinates.x + this.radius,
                    ymin: this.center.coordinates.y - this.radius,
                    ymax: this.center.coordinates.y + this.radius,
                    zmin: this.center.coordinates.z - this.radius,
                    zmax: this.center.coordinates.z + this.radius,
                }

                this.bounds.center = {
                    x: this.center.coordinates.x,
                    y: this.center.coordinates.y,
                    z: this.center.coordinates.z,
                }

                return this;
            }
        };

        this.change = {
            radius: (radius, inSeconds=1) => {
                this.createBasicCircle();
                theAnim = changeViewXProperties(this, {radius: this.radius}, {radius: radius}, inSeconds);
                this.radius = radius;
                return theAnim;
            },

            color: (color, inSeconds=1) => {
                this.createBasicCircle();
                theAnim = changeViewXProperties(this, {stroke: this.color}, {stroke: color}, inSeconds);
                this.color = color;
                return theAnim;
            },

            fillColor: (color, inSeconds=1) => {
                this.createBasicCircle();
                theAnim = changeViewXProperties(this, {circlecolor: this.fillColor}, {circlecolor: color}, inSeconds);
                this.color = color;
                return theAnim;
            },

        };


        this.moveToTop = function() {
            moveToTopViewX(this);
        }

        this.remove = function() {
            viewX.removeCircle(this.space.name + "-graph", this.name)
        }

        this.duplicate = function() {
            newCircle = new Circle(this.center, this.radius);
            newCircle.color = this.color;
            newCircle.thickness = this.thickness;
            newCircle.createBasicCircle();
            return newCircle;
        }

    }



    function ValueSlider(at={x:0, y:0, z:0}, width=5, min=0, max=100, value=50, step=1, sliderProperties={onChange:function(){console.log("Slider value changed")},
    valueTransformToText: function(value) {return value;}, thumbSize: 10, thumbColor: "hsla(198, 100% 60%, 1)", trackColor: "hsla(198, 0%, 0%, 0.4)", trackFillColor: "hsla(198, 100%, 40%, 1)",  thickness: 10, isAlwaysVisible: false, backgroundType:'glassy', borderColor:'hsla(0, 0%, 40%, 0.1)'}, valueDisplayProperties={color: "white", fontSize: "large", font: "Nunito"},  labelTextProperties={color: "white", fontSize: 'auto', font: "Nunito", text: ""}, labelDescriptionProperties={color: "white", fontSize: 'small', font: "Nunito", text: ""}) {
        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)

        this.coordinates = at;

        this.space = rhyform.activeScene.selectedSpace;
        this.name = "valueSlider-" + rhyform.objectAdditionIndex;
        this.sliderProperties = sliderProperties;
        this.valueDisplayProperties = valueDisplayProperties;
        this.labelTextProperties = labelTextProperties;
        this.labelDescriptionProperties = labelDescriptionProperties;
        this.width = width;
        this.height = 1;
        this.min = min;
        this.max = max;
        this.value = value;
        this.step = step;
        this.sliderVisible = true;


        this.bounds = {
            xmin: this.coordinates.x,
            xmax: this.coordinates.x + this.width,
            ymin: this.coordinates.y ,
            ymax: this.coordinates.y,
            zmin: this.coordinates.z,
            zmax:  this.coordinates.z,
        }

        this.bounds.center = {
            x: this.coordinates.x,
            y: this.coordinates.y,
            z: this.coordinates.z,
        }

        this.added = false;
        this.element = null;

        this.createBasicSlider = function() {
            if (!this.added) {

                // <div class="pt-3 ng-scope" ng-repeat="(nodeParameterKey, nodeParameter) in networkGraph.nodes[networkGraph.selectedNode].parameters">
                //     <span class="parameter-display-text ng-binding" ng-click="nodeParameter.editing = !nodeParameter.editing">0.035</span>
                //     <i class="ml-2 fa fa-pencil sub-addition-button" ng-click="nodeParameter.editing = !nodeParameter.editing"></i>
                //     <div class="pb-2" ng-show="nodeParameter.editing">
                //         <input type="range" id="node-slider-recoveryRate" min="0" max="0.3" step="0.001" ng-model="nodeParameter.value" ng-change="networkGraph.changingNodeParameter()" class="ng-untouched ng-valid ng-not-empty ng-dirty ng-valid-parse ng-valid-min ng-valid-max ng-valid-step">
                //     </div>
                //     <div class="text-ignus ng-binding" style="font-size: normal;">
                //         Recovery Rate
                //     </div>
                //     <div class="text-ignus ng-binding" style="font-size: x-small; color: gray;">
                //         The rate at which the node recovers from the disease
                //     </div>
                // </div>

                // get name with spaces removed and lower cased, it should be a copy
                var idName = this.name.replace(/\s/g, '').toLowerCase();

                styleToAdd = `
                #` + idName + `-rhyform-slider-editToggle-button  {
                    color: hsla(0, 0%, 100%, 0.3);
                }

                #` + idName + `-rhyform-slider-editToggle-button:hover {
                    color: white;
                }

                #` + idName + `-rhyform-slider-glassy {
                    background-color: hsla(0, 0%, 10%, 0.4);
                    backdrop-filter: blur(3px);
                }


                @media screen and (-webkit-min-device-pixel-ratio:0) {
                    #` + idName + `-rhyform-slider-input[type='range'] {
                        background-color: hsla(0, 0%, 100%, 0.2);
                        border-radius: 5px;
                        cursor: pointer;
                        padding:  ` + this.sliderProperties.thickness/2 + `px 0;
                    }


                    #` + idName + `-rhyform-slider-input[type='range']::-webkit-slider-runnable-track {
                        -webkit-appearance: none;
                        height: 0px;
                        color: black;
                        margin-top: -10px;
                    }


                    #` + idName + `-rhyform-slider-input[type='range']::-webkit-slider-thumb {
                        width: ` + this.sliderProperties.thumbSize + `px;
                        height: ` + this.sliderProperties.thumbSize + `px;
                        cursor: ew-resize;
                        background: hsla(198, 100%, 50%, 0);
                        box-shadow: -1001px 0px 0px 1000px ` + this.sliderProperties.trackFillColor + `;
                        margin-top: -5px;
                    }

                    #` + idName + `-rhyform-design-slider-input[type='range'] {
                        background-color: ` + this.sliderProperties.trackColor + `;
                        border-radius: 5px;
                        padding:  ` + this.sliderProperties.thickness/2 + `px 0;
                    }

                    #` + idName + `-rhyform-design-slider-input[type='range']::-webkit-slider-runnable-track {
                        height: 0px;
                        color: black;
                        margin-top: -10px;
                    }

                    #` + idName + `-rhyform-design-slider-input[type='range']::-webkit-slider-thumb {
                        width: ` + this.sliderProperties.thumbSize + `px;
                        height: ` + this.sliderProperties.thumbSize + `px;
                        cursor: ew-resize;
                        background: ` + this.sliderProperties.thumbColor + `;
                        box-shadow: 0px 0px 0px 0px hsla(198, 100%, 70%, 0);
                        margin-top: ` + (-1*(this.sliderProperties.thumbSize - 10)/2) + `px;
                    }

                }

                @supports (-moz-appearance:none) {
                    #` + idName + `-rhyform-slider-input[type='range'] {
                        background-color: hsla(0, 0%, 100%, 0);
                        border-radius: 5px;
                        padding: 5px 0;
                    }

                    #` + idName + `-rhyform-design-slider-input[type='range'] {
                        background-color: hsla(0, 0%, 100%, 0);
                        border-radius: 5px;
                        padding: 5px 0;
                    }
                }

                #` + idName + `-rhyform-slider-input[type="range"]::-moz-range-progress {
                    background-color: ` + this.sliderProperties.trackFillColor + `;
                }
                #` + idName + `-rhyform-slider-input[type="range"]::-moz-range-track {
                    background-color: ` + this.sliderProperties.trackColor + `;
                }

                #` + idName + `-rhyform-slider-input[type="range"]::-ms-fill-lower {
                    background-color: ` + this.sliderProperties.trackFillColor + `;
                }
                #` + idName + `-rhyform-slider-input[type="range"]::-ms-fill-upper {
                    background-color: ` + this.sliderProperties.trackColor + `;
                }
                `

                var style = document.createElement("style");
                style.id = idName + "-rhyform-slider-styles";
                style.type = "text/css";

                if (style.styleSheet) {
                    style.styleSheet.cssText = styleToAdd;
                } else {
                    style.appendChild(document.createTextNode(styleToAdd));
                }

                document.getElementById("rhyform-slider-styles").appendChild(style);



                var mainDiv = document.createElement("div");
                mainDiv.id = this.name;
                mainDiv.style.position = "absolute";
                // add class pt-3
                mainDiv.classList.add("p-3");
                mainDiv.classList.add("p-md-4")

                var valueDisplaySpan = document.createElement("span");
                valueDisplaySpan.id = idName + "-value-display";
                valueDisplaySpan.style.fontFamily = this.valueDisplayProperties.font;
                valueDisplaySpan.style.fontSize = this.valueDisplayProperties.fontSize;
                valueDisplaySpan.style.color = this.valueDisplayProperties.color;
                valueDisplaySpan.innerHTML = this.sliderProperties.valueTransformToText(this.value);

                mainDiv.appendChild(valueDisplaySpan);

                mainDiv.style.zIndex = 5;



                if (!this.sliderProperties.isAlwaysVisible) {
                    var editValueIcon = document.createElement("i");
                    editValueIcon.id = idName + "-rhyform-slider-editToggle-button";
                    editValueIcon.classList.add("ml-2");
                    editValueIcon.classList.add("fa");
                    editValueIcon.classList.add("fa-pencil");
                    editValueIcon.classList.add("rhyform-slider-editToggle-button");
                    editValueIcon.onclick = () => {
                        this.sliderVisible = !this.sliderVisible;
                        this.updateSliderVisibility();
                    }

                    mainDiv.appendChild(editValueIcon);


                }


                var sliderDiv = document.createElement("div");
                // add class pb-1
                sliderDiv.classList.add("pb-1");
                sliderDiv.classList.add("mb-4");
                sliderDiv.classList.add("pr-4");
                sliderDiv.style.position = "relative";

                this.sliderDiv = sliderDiv;

                var sliderInput = document.createElement("input");
                sliderInput.type = "range";
                sliderInput.min = this.min;
                sliderInput.max = this.max;
                sliderInput.step = this.step;
                sliderInput.value = this.value;
                sliderInput.id = idName + "-rhyform-slider-input";
                sliderInput.style.width = '100%';

                sliderDiv.appendChild(sliderInput);
                mainDiv.appendChild(sliderDiv);

                sliderInput.oninput = () => {
                    this.value = sliderInput.value;
                    valueDisplaySpan.innerHTML = this.sliderProperties.valueTransformToText(this.value);

                    designSliderInput.value = this.value;
                    this.sliderProperties.onChange();
                }

                sliderInput.onchange = sliderInput.oninput;


                sliderInput.classList.add("rhyform-slider-input");
                sliderInput.style.position = "absolute";

                var designSliderInput = document.createElement("input");
                designSliderInput.type = "range";
                designSliderInput.min = this.min;
                designSliderInput.max = this.max;
                designSliderInput.step = this.step;
                designSliderInput.value = this.value;
                designSliderInput.id = idName + "-rhyform-design-slider-input";
                designSliderInput.style.width = '100%';
                designSliderInput.classList.add("rhyform-design-slider-input");
                designSliderInput.style.pointerEvents = "none";

                sliderDiv.appendChild(designSliderInput);
                designSliderInput.style.position = "absolute";


                if (this.sliderVisible) {
                    sliderDiv.style.display = "block";
                }

                if (this.labelTextProperties.text != "") {

                    var labelTextDiv = document.createElement("div");
                    labelTextDiv.id = this.name + "-label-text";
                    labelTextDiv.style.fontFamily = this.labelTextProperties.font;
                    labelTextDiv.style.fontSize = this.labelTextProperties.fontSize;
                    labelTextDiv.style.color = this.labelTextProperties.color;
                    labelTextDiv.innerHTML = this.labelTextProperties.text;

                    mainDiv.appendChild(labelTextDiv);
                }

                if (this.labelDescriptionProperties.text != "") {

                    var labelDescriptionDiv = document.createElement("div");
                    labelDescriptionDiv.id = this.name + "-label-description";
                    labelDescriptionDiv.style.fontFamily = this.labelDescriptionProperties.font;
                    labelDescriptionDiv.style.fontSize = this.labelDescriptionProperties.fontSize;
                    labelDescriptionDiv.style.color = this.labelDescriptionProperties.color;
                    labelDescriptionDiv.innerHTML = this.labelDescriptionProperties.text;

                    mainDiv.appendChild(labelDescriptionDiv);
                }




                htmlCoordinates = viewX.getHTMLCoordinates(this.space.name + "-graph", this.coordinates.x, this.coordinates.y)

                mainDiv.style.left = htmlCoordinates.x + "px";
                mainDiv.style.top = htmlCoordinates.y + "px";

                mainDiv.style.width = this.width*this.space.camera.pixelsPerUnit + "px";

                document.getElementById(this.space.name + "-html-layer").appendChild(mainDiv);
                mainDiv.style.opacity = 0;




                if (this.sliderProperties.backgroundType == "glassy") {
                    mainDiv.classList.add("rhyform-slider-glassy");
                }
                else if (this.sliderProperties.backgroundType == "solid") {
                    mainDiv.style.background = "rgba(0, 0, 0, 0.2)";
                }

                if (this.sliderProperties.borderColor != "none") {
                    mainDiv.style.border = "2px solid " + this.sliderProperties.borderColor;
                }

                mainDiv.style.borderRadius = "10px";

                typesetIfReady([mainDiv])

                this.added = true;
                this.element = mainDiv;

            }
        }

        this.updateSliderVisibility = function() {
            if (this.sliderVisible) {
                this.sliderDiv.style.display = "block";
            }
            else {
                this.sliderDiv.style.display = "none";
            }
        }


        this.updateSlider = function() {
            if (!this.added) {
                this.createBasicSlider();
            }

            idName = this.name.replace(/\s/g, '').toLowerCase();
            this.element.querySelector("#" + idName + "-value-display").innerHTML = this.sliderProperties.valueTransformToText(this.value);

            this.element.querySelector("#" + idName + "-rhyform-slider-input").min = this.min;
            this.element.querySelector("#" + idName + "-rhyform-slider-input").max = this.max;
            this.element.querySelector("#" + idName + "-rhyform-slider-input").step = this.step;

            this.element.querySelector("#" + idName + "-rhyform-design-slider-input").min = this.min;
            this.element.querySelector("#" + idName + "-rhyform-design-slider-input").max = this.max;
            this.element.querySelector("#" + idName + "-rhyform-design-slider-input").step = this.step;


            this.element.querySelector("#" + idName + "-rhyform-slider-input").value = this.value;
            this.element.querySelector("#" + idName + "-rhyform-design-slider-input").value = this.value;


            this.updateSliderVisibility();


        }

        this.set = {
            value: (value) => {
                this.value = value;
                this.updateSlider();
                return this;
            },

            min: (min) => {
                this.min = min;
                this.updateSlider();
                return this;
            },

            max: (max) => {
                this.max = max;
                this.updateSlider();
                return this;

            },

            step: (step) => {
                this.step = step;
                this.updateSlider();
                return this;
            },
        }



        this.show = function(inSeconds=1) {
            this.createBasicSlider();
            theAnim = showElement(this, inSeconds);
            return theAnim;
        }

        this.hide = function(inSeconds=1) {
            // this.element.style.pointerEvents = "none";
            theAnim = hideElement(this, inSeconds);
            return theAnim;
        }

        this.remove = function() {
            this.element.remove();
        }

        this.duplicate = function() {
            newSlider = new ValueSlider(this.coordinates, this.width, this.min, this.max, this.value, this.step, this.sliderProperties, this.valueDisplayProperties, this.labelTextProperties, this.labelDescriptionProperties);
            newSlider.createBasicSlider();
            return newSlider;
        }

        return this;


    }

    function AnimationGroup() {
        const owningScene = rhyform.activeScene;
        this.list = [];
        this.addAnim = function(animation) {
            animation.group = this;
            if (this.list.length > 0) {
                this.list[this.list.length-1].next = animation;
            }

            if (this.list.length == 0) {
                animation.beginsAGroup = true;
            }

            this.list.push(animation);
        }

        this.startGroupAnimationsImmediately = false;

        this.startNextImmediately = function() {
            this.startGroupAnimationsImmediately = true;
            owningScene.invalidate();
            return this;
        }

    }


    function Animation(start=0, end=1, duration=1, fps=30, animateImmediately=false, animOptions={}, type="viewX") {

        svgTools.duration(duration);
        const owningScene = rhyform.activeScene;
        this.name = "animation-" + rhyform.activeScene.animationAdditionIndex + "-forScene-" + rhyform.activeScene.name;
        this.start = start;
        this.end = end;
        this.duration = duration;
        this.fps = fps;
        this.animateNextImmediately = animateImmediately;
        this.type = type;
        this.viewXAnimation = null;



        if (type == "viewX") {
            this.animationOptions = animOptions;
            this.viewXAnimation = viewX.addAnimation(this.name, animOptions)
        }

        if (type == "html-css-style") {
            this.animationOptions = animOptions;
        }

        if (type == "inner-html") {
            this.animationOptions = animOptions;
        }

        if (type == "audio") {
            this.animationOptions = animOptions;
        }

        if (type == 'wait') {
            this.animationOptions = animOptions;
        }

        if (type == 'function') {
            this.animationOptions = animOptions;
        }


        rhyform.activeScene.animations[this.name] = this;
        rhyform.activeScene.animationAdditionIndex += 1;

        this.startNextImmediately = () => {
            this.animateNextImmediately = true;
            owningScene.invalidate();
            return this;
        };

        return this;
    }

    // Add this audio file to HTML document

    function Audio(url) {
        this.url = url;
        this.name = "audio-" + rhyform.activeScene.audioAdditionIndex;
        this.added = false;
        this.element = null;
        this.volume = 1;

        this.tags = [];

        this.addTag = function(tagName) {
            manageTags(tagName, this, 'add');
            return this;
        }

        this.removeTag = function(tagName) {
            manageTags(tagName, this, 'remove');
            return this;
        }

        this.scene = rhyform.activeScene;
        this.addTag("<scene>" + this.scene.name)

        this.createBasicAudio = function() {
            if (!this.added) {
                addingAudioData = {url: this.url}
                addingAudio = document.createElement("audio");
                addingAudio.id = this.name;
                addingAudio.src = this.url;
                addingAudio.loop = this.loop;
                addingAudio.volume = this.volume;
                document.body.appendChild(addingAudio);
                this.added = true;
                this.element = addingAudio;
            }
        }

        this.createBasicAudio()

        rhyform.activeScene.audioAdditionIndex += 1;

        this.play = function(from=0) {
            this.createBasicAudio();
            audioOptions = {element: this.element, action: "play", from: from}
            anim = new Animation(start=0, end=1, duration=1, fps=30, animateImmediately=false, animOptions=audioOptions, type="audio")
            return anim;
        }


        this.pause = function() {
            this.createBasicAudio();
            audioOptions = {element: this.element, action: "pause"}
            anim = new Animation(start=0, end=1, duration=1, fps=30, animateImmediately=false, animOptions=audioOptions, type="audio")
            return anim;
        }

        this.stop = function() {
            this.createBasicAudio();
            audioOptions = {element: this.element, action: "stop"}
            anim = new Animation(start=0, end=1, duration=1, fps=30, animateImmediately=false, animOptions=audioOptions, type="audio")
            return anim;
        }

        this.loadWith = {
            volume: (volume) => {
                this.volume = volume;
                this.createBasicAudio();
                updatingAudioData = {volume: this.volume}
                this.element.volume = this.volume;
                return this;
            },

            loop: (loop) => {
                this.loop = loop;
                this.createBasicAudio();
                updatingAudioData = {loop: this.loop}
                this.element.loop = this.loop;
                return this;
            },
        };

        this.remove = function() {
            this.element.remove();
        }

        this.duplicate = function() {
            newAudio = new Audio(this.url);
            newAudio.loop = this.loop;
            newAudio.volume = this.volume;
            newAudio.createBasicAudio();
            return newAudio;
        }

    }










    function hideShowTagGroup(type, tag, inSeconds=1) {
        const elements = rhyform.tags[tag] || [];

        htmlAnimationsToAdd = []

        startWith = type == 0 ? 1 : 0
        endWith = type == 0 ? 0 : 1

        animationOptions = {}
        animationOptions.keyframes = {}
        animationOptions.keyframes["0"] = {}
        animationOptions.keyframes[inSeconds.toString()] = {}

        animationOptions.elementsAndPropertiesInvolved = {}


        for (let element of elements) {


            if (element instanceof Point || element instanceof Line || element instanceof Circle || element instanceof Curve) {

                element.seen = type == 1 ? true : false;

                // console.log(element)

                if (element instanceof Point) {
                    element.updatePointRender();
                }

                if (element instanceof Line) {
                    element.updateLineRender();
                }

                if (element instanceof Circle) {
                    element.updateCircleRender();
                }


                // console.log(element)

                // if (element.element != null) {
                //     if (type == 0) {
                //         element.element[0].style.pointerEvents = "none";
                //     }
                //     else {
                //         element.element[0].style.pointerEvents = "auto";
                //     }
                // }


                animationOptions.keyframes["0"][element.name] = {
                    'graph': element.space.name + "-graph",
                    'object': element.name,
                    'options': { opacity: startWith}
                }

                animationOptions.keyframes[inSeconds.toString()][element.name] = {
                    'graph': element.space.name + "-graph",
                    'object': element.name,
                    'options': { opacity: endWith}
                }

                animationOptions.elementsAndPropertiesInvolved[element.name] = {
                    element: element,
                    properties: ['opacity']
                }

            } else if (element instanceof Text || element instanceof ValueSlider || element.element?.dataset?.rhyform) {

                // if (type == 0) {
                //     element.element.style.pointerEvents = "none";
                // }
                // else {
                //     element.element.style.pointerEvents = "auto";
                // }

                htmlAnimationOptions = {
                    "propertiesAtStart": {
                        "opacity": startWith,
                    },
                    "propertiesAtEnd": {
                        "opacity": endWith,
                    },
                    "element": element.element,
                }

                htmlAnimationOptions.elementsAndPropertiesInvolved = {}

                htmlAnimationOptions.elementsAndPropertiesInvolved[element.name] = {
                    element: element,
                    properties: ['opacity']
                }


                htmlAnimationsToAdd.push({
                    "element": element.element,
                    "seconds": inSeconds,
                    "options": htmlAnimationOptions
                })


            }
            else if (element instanceof Button) {

                element = element.textObject

                // if (type == 0) {
                //     element.element.style.pointerEvents = "none";
                // }
                // else {
                //     element.element.style.pointerEvents = "auto";
                // }


                htmlAnimationOptions = {
                    "propertiesAtStart": {
                        "opacity": startWith,
                    },
                    "propertiesAtEnd": {
                        "opacity": endWith,
                    },
                    "element": element.element,
                }

                htmlAnimationOptions.elementsAndPropertiesInvolved = {}

                htmlAnimationOptions.elementsAndPropertiesInvolved[element.name] = {
                    element: element,
                    properties: ['opacity']
                }


                htmlAnimationsToAdd.push({
                    "element": element.element,
                    "seconds": inSeconds,
                    "options": htmlAnimationOptions
                })


            } else {
                console.log("Unknown element type with tag ", tag);
            }


        }


        animGroup = new AnimationGroup()

        anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = true, animOptions=animationOptions)
        animGroup.addAnim(anim)

        for (let htmlAnimation of htmlAnimationsToAdd) {
            htmlAnim = new Animation(0, htmlAnimation.seconds, htmlAnimation.seconds, 30, animateImmediately = true, animOptions=htmlAnimation.options, type="html-css-style")
            animGroup.addAnim(htmlAnim)
        }

        animGroup.list[animGroup.list.length - 1].animateNextImmediately = false
        return animGroup;
    }

    // add style to head

    function styleToHead() {
        let style = document.createElement('style');
        style.id = "rhyform-styles";
        style.type = 'text/css';
        style.innerHTML = `
        .rhyform-button {
            background-color: transparent;
            cursor: pointer;
        }
        .rhyform-button:hover {
            background-color: white;
            color: black !important;
        }

        .rhyform-button:active {
            background-color: white;
            color: black;
        }

        .rhyform-gradient-text {
            background-image: linear-gradient(to left top, hsla(var(--base-hue), 100%, 50%, 1), hsla(var(--secondary-hue), 100%, 50%, 1));
            background-clip: text;
            -webkit-background-clip: text;
            -moz-background-clip: text;
            -webkit-text-fill-color: transparent;
            -moz-text-fill-color: transparent;
        }

        .rhyform-gradient-text:hover {
            background-color: white !important;
            background-image: none !important;
            background-clip: none; !important;
            -webkit-background-clip: none;
            -moz-background-clip: none;
            -webkit-text-fill-color: auto;
            -moz-text-fill-color: auto;
            color: black !important;
        }

        .rhyform-slider-editToggle-button {
            font-size: 12px;
            cursor: pointer;
            color: hsla(0, 0%, 100%, 0.3);
        }

        .rhyform-slider-editToggle-button:hover {
            color: white;
        }

        .rhyform-slider-glassy {
            background-color: hsla(0, 0%, 10%, 0.4);
            backdrop-filter: blur(3px);
        }



        /*Chrome*/
        @media screen and (-webkit-min-device-pixel-ratio:0) {
            .rhyform-slider-input[type='range'] {
                overflow: hidden;
                -webkit-appearance: none;
                background-color: hsla(0, 0%, 100%, 0.2);
                border-radius: 5px;
                padding: 3px 0;
            }

            .rhyform-slider-input[type='range']::-webkit-slider-runnable-track {
                -webkit-appearance: none;
                height: 0px;
                width: 100%;
                color: black;
                margin-top: -10px;
                border-radius: 50%;
            }

            .rhyform-slider-input[type='range']::-webkit-slider-thumb {
                width: 20px;
                -webkit-appearance: none;
                height: 20px;
                cursor: ew-resize;
                background: hsla(198, 100%, 50%, 0);
                box-shadow: -1001px 0px 0px 1000px hsla(198, 100%, 50%, 1);
                border-radius: 50%;
                margin-top: -5px;
                position: relative;
            }

            .rhyform-design-slider-input[type='range'] {
                overflow: visible;
                -webkit-appearance: none;
                background-color: hsla(0, 0%, 100%, 0.2);
                border-radius: 5px;
                padding: 3px 0;
            }

            .rhyform-design-slider-input[type='range']::-webkit-slider-runnable-track {
                -webkit-appearance: none;
                height: 0px;
                width: 100%;
                color: black;
                margin-top: -10px;
                border-radius: 50%;
            }

            .rhyform-design-slider-input[type='range']::-webkit-slider-thumb {
                width: 20px;
                -webkit-appearance: none;
                height: 20px;
                cursor: ew-resize;
                background: hsla(198, 100%, 70%, 1);
                box-shadow: 0px 0px 0px 0px hsla(198, 100%, 70%, 0);
                border-radius: 50%;
                margin-top: -5px;
                position: relative;
            }

        }

        @supports (-moz-appearance:none) {
            .rhyform-slider-input[type='range'] {
                overflow: hidden;
                -webkit-appearance: none;
                background-color: hsla(0, 0%, 100%, 0);
                border-radius: 5px;
                padding: 5px 0;
            }

            .rhyform-design-slider-input[type='range'] {
                overflow: hidden;
                -webkit-appearance: none;
                background-color: hsla(0, 0%, 100%, 0);
                border-radius: 5px;
                padding: 5px 0;
            }
          }


        /** FF*/
        .rhyform-slider-input[type="range"]::-moz-range-progress {
            background-color: hsla(198, 100%, 50%, 1);
        }
        .rhyform-slider-input[type="range"]::-moz-range-track {
            background-color: hsla(0, 0%, 100%, 0.2);
        }
        /* IE*/
        .rhyform-slider-input[type="range"]::-ms-fill-lower {
            background-color: hsla(198, 100%, 50%, 1);
        }
        .rhyform-slider-input[type="range"]::-ms-fill-upper {
            background-color: hsla(0, 0%, 100%, 0.2);
        }

        `;

        document.getElementsByTagName('head')[0].appendChild(style);


        var sliderStylesDiv = document.createElement("div");
        sliderStylesDiv.id = "rhyform-slider-styles";
        sliderStylesDiv.style.display = "none";
        document.body.appendChild(sliderStylesDiv);

    }

    if (document.body) styleToHead();
    else document.addEventListener("DOMContentLoaded", styleToHead, {once: true});

    // Public API
    return {
        scenes: {},
        spaces: {},
        tags: {},
        activeScene: null,

        font: "Nunito",
        fontSize: "auto",

        objectAdditionIndex: 0,

        drawingPrecision: 10,





        libraryFunctions: {
            convertBoundsToViewXBounds : function(bounds) {
                return {
                    xmax: bounds.x + bounds.width,
                    xmin: bounds.x,

                    ymax: bounds.y + bounds.height,
                    ymin: bounds.y
                }
            },
            distanceBetweenPoints: function(point1, point2) {
                const a = point1.coordinates || point1;
                const b = point2.coordinates || point2;
                return Math.hypot(svgTools.finite(a.x) - svgTools.finite(b.x), svgTools.finite(a.y) - svgTools.finite(b.y), (a.z || 0) - (b.z || 0));
            }

        },

        wait : function(forSeconds=1) {
            anim = new Animation(0, forSeconds, forSeconds, 30, animateImmediately = false, animOptions={}, type="wait")
            return anim;
        },

        runFunction : function(func, inSeconds=1) {
            animOptions = {
                "function": func
            }
            anim = new Animation(0, inSeconds, inSeconds, 30, animateImmediately = false, animOptions=animOptions, type="function")
            return anim;
        },

        showElementsWithTag: function(tag, inSeconds=1) {
            return hideShowTagGroup(1, tag, inSeconds)
        },

        hideElementsWithTag: function(tag, inSeconds=1) {
            return hideShowTagGroup(0, tag, inSeconds)
        },

        removeElementsWithTag: function(tag) {
            const elements = rhyform.tags[tag] || [];

            for (let element of elements) {
                if (element != null) {
                    // console.log(element)
                    element.remove()

                    // remove from other tags too
                    if (element.tags) {
                        for (let othertag of element.tags) {
                            if (othertag) {
                                rhyform.tags[othertag] = rhyform.tags[othertag].filter(e => e !== element);
                            }
                        }
                    }
                }
            }

            for (let element of elements) {
                if (element && element.name && rhyform[element.name]) {
                    // delete Instance
                    delete rhyform[element.name]
                }
            }

            if (rhyform.tags && rhyform.tags[tag]) {
                delete rhyform.tags[tag];
            }
        },

        deleteElementsWithTag: function(tag) {
            rhyform.removeElementsWithTag(tag)
        },


        duplicateElementsWithTag: function(tag) {
            const elements = rhyform.tags[tag] || [];

            newElements = []
            for (let element of elements) {
                if (element != null) {
                    // console.log(element)
                    newElement = element.duplicate()
                    newElements.push(newElement)
                }
            }

            return newElements;
        },

        addTagToElements: function(elements, tag) {
            for (let element of elements) {
                if (element != null) {
                    element.addTag(tag)
                }
            }
        },



        createGradient: function(at=[{color: 'white', position: 0}, {color: "black", position: 1}], direction="horizontal") {
            return new Gradient(at, direction);
        },

        createScene: function(sceneName) {
            let scene = new Scene(sceneName);
            this.scenes[sceneName] = scene;
            return scene;
        },

        createSpaceInElement: function(elementSelector, spaceName) {
            if (spaceName == undefined) {
                spaceName = "space" + Object.keys(this.spaces).length;
            }
            let space = new Space(spaceName, elementSelector);
            this.spaces[spaceName] = space;
            return space;
        },

        createPoint: function(at={x:0, y:0, z:0}, size=0.5, color="white") {
            return new Point(at, size, color);
        },

        createText: function(content) {
            return new Text(content);
        },

        createLine: function(point1, point2) {
            if (!(point1 instanceof Point)) {
                point1= new Point(at={x:0, y:0, z:0});
            }

            if (!(point2 instanceof Point)) {
                point2= new Point(at={x:1, y:1, z:1});
            }

            return new Line(between=[point1, point2]);
        },

        createCurve: function(points=[]) {
            return new Curve(points);
        },

        createCircle: function(point, radius) {
            if (!(point instanceof Point)) {
                point= new Point(at={x:0, y:0, z:0});
            }

            return new Circle(point, radius);
        },

        createAudio: function(url) {
            return new Audio(url);
        },

        createSound: function(url) {
            return new Audio(url);
        },

        createButton: function(content, onClick=()=>{}) {
            return new Button(content, onClick);
        },

        createSlider: function(options={}) {

            const defaults = {
                at: {x: 0, y: 0, z: 0},
                width: 5,
                min: 0,
                max: 100,
                value: 50,
                step: 1,
                sliderProperties: {
                    onChange: function(){ console.log("Slider value changed"); },
                    valueTransformToText: function(value) {return value;},
                    thumbSize: 20,
                    thumbColor: "hsla(198, 100% 60%, 1)",
                    trackFillColor: "hsla(198, 100%, 40%, 1)",
                    trackColor: "hsla(198, 0%, 100%, 0.3)",
                    thickness: 10,
                    isAlwaysVisible: false,
                    backgroundType: 'glassy',
                    borderColor: 'hsla(0, 0%, 50%, 0.1)'
                },
                valueDisplayProperties: {
                    color: "white",
                    fontSize: "xxx-large",
                    font: "Gaegu"
                },
                labelTextProperties: {
                    color: "hsla(0, 0%, 70%, 1)",
                    fontSize: 'auto',
                    font: "Gaegu",
                    text: "Temperature"
                },
                labelDescriptionProperties: {
                    color: "hsla(0, 0%, 40%, 1)",
                    fontSize: 'small',
                    font: "Gaegu",
                    text: "The value represents the change in some quantity that is important to this visualization. Maybe it's the number of people in a room, or the amount of money in a bank account or number of stars in a galaxy ⭐️."
                }
            };


            const sliderProperties = Object.assign({}, defaults.sliderProperties, options.sliderProperties);
            const valueDisplayProperties = Object.assign({}, defaults.valueDisplayProperties, options.valueDisplayProperties);
            const labelTextProperties = Object.assign({}, defaults.labelTextProperties, options.labelTextProperties);
            const labelDescriptionProperties = Object.assign({}, defaults.labelDescriptionProperties, options.labelDescriptionProperties);

            const params = Object.assign({}, defaults, options);
            params.sliderProperties = sliderProperties;
            params.valueDisplayProperties = valueDisplayProperties;
            params.labelTextProperties = labelTextProperties;
            params.labelDescriptionProperties = labelDescriptionProperties;

            return new ValueSlider(params.at, params.width, params.min, params.max, params.value, params.step, params.sliderProperties, params.valueDisplayProperties, params.labelTextProperties, params.labelDescriptionProperties);
        },




        selectActiveScene: function(scene) {
            this.activeScene = scene;
        },

        moveToTop: function(element) {
        },


    };

})();
