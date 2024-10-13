// Import necessary modules from the Three.js library and its examples
import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { FontLoader, TextGeometry } from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

// Initialize the main scene and camera for 3D rendering
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Perspective camera with FOV of 75 degrees

// Initialize the GLTFLoader for loading 3D models
const loader = new GLTFLoader();

// Create a map to hold loaded figures and their labels
const loadedFigures = {};
const figureLabelMap = new Map();

// Variables for positioning adjustments
let addX, addY;
let maxX = 0; // Track maximum X position for layout adjustments
let maxY = 0; // Track maximum Y position for layout adjustments

let switcher = 0; // Switcher for toggling UI elements
var editError = 0; // Track errors during editing

// DOM elements for controls and forms
const controls_side = document.getElementById('controls');
const editForm = document.getElementById('editForm');

// Sidebar toggle functionality for shrinking the input window
const body = document.querySelector("body"),
sidebar = body.querySelector(".sidebar"),
btn = body.querySelector(".btn");

btn.addEventListener('click', function() {
    this.classList.toggle('click');
    sidebar.classList.toggle("close");
});

// Initialize variables for controls, floor dimensions, and clicked objects
let controls;
let floorWidth, floorHeight;
let clickedFigure; // Stores the currently clicked figure
let floorName;
let floorSiteName;
let objToRender = 'figure'; // Default object type to render

// Create the WebGL renderer and set its size to the full window
const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container3D").appendChild(renderer.domElement);

// Initialize raycasting for object interaction and an array to hold clickable objects
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clickableObjects = [];

// Load floor data and figures from a script element in the HTML
const floorDataScript = document.getElementById('floor-data');
if (floorDataScript) {
    try {
        // Parse the floor and figures data from the script element
        const { floor, figures } = JSON.parse(floorDataScript.textContent);
        console.log("Floor Data:", floor);
        console.log("figures Data:", figures);

        // Extract floor properties from the parsed data
        floorName = floor.fields.name;
        floorWidth = parseFloat(floor.fields.width);
        floorHeight = parseFloat(floor.fields.length);
        const floorColor = parseInt(floor.fields.color, 16);
        const gridX = parseFloat(floor.fields.gridx);
        const gridY = parseFloat(floor.fields.gridy);
        floorSiteName = floor.fields.site_name;

        console.log("Floor Width:", floorWidth);
        console.log("Floor Height:", floorHeight);
        console.log("Floor Color:", floorColor);
        console.log("Floor Grid X:", gridX);
        console.log("Floor Grid Y:", gridY);

        if (!isNaN(floorWidth) && !isNaN(floorHeight)) {
            // Create a plane geometry to represent the floor
            const geometry = new THREE.PlaneGeometry(floorWidth, floorHeight);
            const material = new THREE.MeshBasicMaterial({ color: floorColor, side: THREE.DoubleSide });

            const floorMesh = new THREE.Mesh(geometry, material);
            floorMesh.rotation.x = -Math.PI / 2; // Rotate the floor to lie flat
            scene.add(floorMesh);

            // Create grid lines for the floor
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
            const gridHeightOffset = 0.01; // Slightly raise the grid above the floor

            const measurementX = (gridX / 60) * 1;
            const measurementY = (gridY / 60) * 1;
            
            // Add vertical grid lines
            for (let i = measurementX; i <= floorWidth; i += 1) {
                const points = [];
                points.push(new THREE.Vector3(i - floorWidth / 2, gridHeightOffset, -floorHeight / 2));
                points.push(new THREE.Vector3(i - floorWidth / 2, gridHeightOffset, floorHeight / 2));

                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
            }

            // Add horizontal grid lines
            for (let j = measurementY; j <= floorHeight; j += 1) {
                const points = [];
                points.push(new THREE.Vector3(-floorWidth / 2, gridHeightOffset, j - floorHeight / 2));
                points.push(new THREE.Vector3(floorWidth / 2, gridHeightOffset, j - floorHeight / 2));

                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
            }

            // Set initial camera position and orientation
            camera.position.set(0, 5, 10);
            camera.lookAt(new THREE.Vector3(0, 0, 0));

            // Add ambient and point lights to the scene
            const ambientLight = new THREE.AmbientLight(0x404040, 2); // Ambient light for overall illumination
            scene.add(ambientLight);

            const pointLight1 = new THREE.PointLight(0xffffff, 1, 100); // Point light for shadows and highlights
            pointLight1.position.set(10, 10, 10);
            scene.add(pointLight1);

            const pointLight2 = new THREE.PointLight(0xffffff, 1, 100); // Additional point light
            pointLight2.position.set(-10, -10, -10);
            scene.add(pointLight2);

            // Render figures on the floor
            renderFigures(figures, floorWidth, floorHeight);

            // Initialize orbit controls for camera interaction
            controls = new OrbitControls(camera, renderer.domElement);

            const floorPosition = floorMesh.position;

            // Function to track mouse movement and raycast to detect intersections with the floor
            function onMouseMove(event) {
                const rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / renderer.domElement.clientWidth) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / renderer.domElement.clientHeight) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);

                const intersects = raycaster.intersectObject(floorMesh);

                if (intersects.length > 0) {
                    const intersect = intersects[0];
                    const point = intersect.point;

                    const TileX = point.x + (floorWidth / 2);
                    const TileY = point.z + (floorHeight / 2);
                    console.log('Mouse is over grid tile (x, y):', TileX, TileY);
                }
            }

            // Add event listener for mouse movement
            window.addEventListener('mousemove', onMouseMove, false);
            
        } else {
            console.error("Invalid floor dimensions:", floorWidth, floorHeight);
        }
    } catch (error) {
        console.error("Error parsing JSON data:", error);
    }
} else {
    console.error("Floor data script not found");
}


// Function to render all figures based on the provided data
function renderFigures(figures) {
    const fontLoader = new FontLoader(); // Loader for font to be used in labels
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        figures.forEach(figureData => {
            try {
                // Parse figure properties from the provided data
                const xPosition     = parseFloat(figureData.fields.x_position);
                const yPosition     = parseFloat(figureData.fields.y_position);
                const figureWidth   = parseFloat(figureData.fields.width);
                const figureHeight  = parseFloat(figureData.fields.height);
                const figureDepth   = parseFloat(figureData.fields.depth);
                const figureAngle   = parseFloat(figureData.fields.angle);
                const figureType    = figureData.fields.figure_type;
                const figureColor   = figureData.fields.color;
                const figureName    = figureData.fields.figure_name;
                const figureId      = figureData.pk;
                const figureRackId  = parseInt(figureData.fields.rack_id);

                const figureAngleRadians = THREE.MathUtils.degToRad(figureAngle); // Convert angle to radians
                
                console.log('Figure Name = ', figureName);

                // Check for valid figure data and skip perforated tiles (handled differently)
                if (!isNaN(xPosition) && !isNaN(yPosition) && !isNaN(figureWidth) && !isNaN(figureHeight) && !isNaN(figureDepth) && figureName !== 'perforated_tile') {
                    loader.load(
                        `/static/myapp/models/${figureName}/scene.gltf`, // Load the 3D model
                        function (gltf) {
                            loadedFigures[figureName] = gltf.scene;

                            const figureObject = loadedFigures[figureName].children[0];
                            const bbox = new THREE.Box3().setFromObject(figureObject); // Calculate bounding box

                            const actualFigureWidth = bbox.max.x - bbox.min.x;
                            const actualFigureHeight = bbox.max.y - bbox.min.y;
                            const actualFigureDepth = bbox.max.z - bbox.min.z;
                            
                            addX = 0;
                            addY = 0;

                            console.log("Actual Figure Width:", actualFigureWidth);

                            // Apply custom color to the figure if specified
                            if (figureColor !== 'none' && figureColor !== 'None' && figureColor !== 'NONE')
                            {
                                figureObject.traverse((node) => {
                                    if (node.isMesh && node.material) {
                                        node.material.color.set(figureColor);
                                    }
                                });
                            }
                            
                            const figureMesh = loadedFigures[figureName].clone(); // Clone the loaded figure

                            figureMesh.rotation.y = figureAngleRadians; // Set the rotation based on the angle

                            switch (figureName) {
                                case 'rack':
                                    if (figureAngle === 0 || figureAngle === 180) {
                                        addX = 0.5 * (figureDepth - figureWidth);
                                        addY = 0.5 * (figureWidth - figureDepth);
                                    } else if (figureAngle === 90 || figureAngle === 270) {
                                        addX = 0;
                                        addY = 0;
                                    }
                                    figureMesh.position.set(xPosition - floorWidth / 2 - addX + figureDepth / 2, 0.01, yPosition - floorHeight / 2 - addY + figureWidth / 2);
                                    figureMesh.scale.set(figureWidth, figureHeight, figureDepth);
                                    break;

                                case 'cooler':
                                    // Set position based on angle for cooler figure type
                                    if (figureAngle === 0) {
                                        addX = 0;
                                        addY = 0;
                                    } else if (figureAngle === 90) {
                                        addX = figureDepth;
                                        addY = figureWidth - figureDepth;
                                    } else if (figureAngle === 180) {
                                        addX = figureWidth;
                                        addY = -figureDepth;
                                    } else if (figureAngle === 270) {
                                        addX = 0;
                                        addY = -figureDepth;
                                    } else {
                                        console.log("Cooler figure angle not properly set");
                                    }

                                    figureMesh.position.set(
                                        xPosition - floorWidth / 2 + addX,
                                        0.01,
                                        yPosition - floorHeight / 2 + addY + figureDepth
                                    );

                                    figureMesh.scale.set(
                                        figureWidth / actualFigureWidth,
                                        figureHeight / actualFigureHeight,
                                        figureDepth / actualFigureDepth
                                    );
                                    break;

                                case 'raised_floor':
                                    // Adjust position for raised floor figure type
                                    if (figureAngle === 0) {
                                        addX = 0;
                                        addY = 0;
                                    } else if (figureAngle === 90) {
                                        addX = -floorWidth - figureWidth / 1.01;
                                        addY = floorHeight + figureDepth * 0.75;
                                    } else if (figureAngle === 180) {
                                        addX = figureWidth;
                                        addY = -figureDepth * 1.06;
                                    } else if (figureAngle === 270) {
                                        addX = -figureWidth * 0.09;
                                        addY = -figureDepth * 0.6;
                                    }

                                    figureMesh.position.set(xPosition - floorWidth / 2 + addX + figureWidth * 1.515, 0.01, yPosition - floorHeight / 2 - figureDepth * 3.85 + addY);
                                    figureMesh.scale.set(
                                        figureWidth / actualFigureWidth,
                                        figureHeight / actualFigureHeight,
                                        figureDepth / actualFigureDepth
                                    );
                                    break;

                                case 'electrical_panel':
                                    figureMesh.position.set(xPosition - floorWidth / 2 + addX + figureWidth / 2, figureHeight / 2 + 0.01, yPosition - floorHeight / 2 + addY + figureDepth / 9);
                                    figureMesh.scale.set(
                                        figureWidth / actualFigureWidth,
                                        figureHeight / actualFigureHeight,
                                        figureDepth / actualFigureDepth
                                    );
                                    break;

                                default:
                                    console.error("Unknown figure type:", figureType);
                            }

                            // Set user data for interaction and identification
                            figureMesh.userData.figureName = figureName;
                            figureMesh.userData.figureId = figureId;
                            figureMesh.userData.figureType = figureType;
                            figureMesh.userData.x_position = xPosition;
                            figureMesh.userData.y_position = yPosition;
                            figureMesh.userData.figureWidth = figureWidth;
                            figureMesh.userData.figureHeight = figureHeight;
                            figureMesh.userData.figureDepth = figureDepth;
                            figureMesh.userData.figureAngle = figureAngle;
                            figureMesh.userData.rack_id = figureRackId;
                            figureMesh.userData.figureColor = figureColor;

                            // Track maximum X and Y positions for layout
                            var checkMaxX = xPosition;
                            var checkMaxY = yPosition;

                            if (figureAngle === 0 || figureAngle === 180) {
                                checkMaxX += figureWidth;
                                checkMaxY += figureDepth;
                            } else if (figureAngle === 90 || figureAngle === 270) {
                                checkMaxX += figureDepth;
                                checkMaxY += figureWidth;
                            }

                            if (maxX < checkMaxX) {
                                maxX = checkMaxX;
                            }
                            if (maxY < checkMaxY) {
                                maxY = checkMaxY;
                            }

                            console.log('maxX:', maxX);
                            console.log('maxY:', maxY);

                            document.getElementById('floorWidth').setAttribute("min", maxX);
                            document.getElementById('floorHeight').setAttribute("min", maxY);

                            // Add figure to clickable objects array and to the scene
                            clickableObjects.push(figureMesh);
                            scene.add(figureMesh);

                            // Add a label to the figure, except for raised floor
                           // if (figureName !== 'raised_floor') {
                           //     addLabel(figureType, figureMesh, font);
                           // }
                        },
                        function (xhr) {
                            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
                        },
                        function (error) {
                            console.error("Error loading figure:", error);
                        }
                    );
                } else if (figureName === 'perforated_tile') {
                    // Handle perforated tiles separately as a group of lines
                    const lineMat = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
                    const perforatedTileGroup = new THREE.Group();
                    perforatedTileGroup.userData = {
                        figureName: 'perforated_tile',
                        figureType: 'Perforated Tile',
                        figureWidth: figureWidth,
                        figureHeight: figureHeight,
                        figureDepth: figureDepth,
                        figureAngle: figureAngle,
                        rack_id: figureRackId,
                        figureColor: figureColor,
                        x_position: xPosition,
                        y_position: yPosition,
                        figureId: figureId
                    };

                    // Create vertical lines for the perforated tile
                    for (let i = xPosition; i <= xPosition + 1; i += 0.1) {
                        const perftiles = [];
                        perftiles.push(new THREE.Vector3(i - floorWidth / 2, 0.01, yPosition - floorHeight / 2));
                        perftiles.push(new THREE.Vector3(i - floorWidth / 2 , 0.01, yPosition + 1 - floorHeight / 2));
        
                        const lineGeo = new THREE.BufferGeometry().setFromPoints(perftiles);
                        const perfLine = new THREE.Line(lineGeo, lineMat);
                        perforatedTileGroup.add(perfLine);
                    }

                    // Create horizontal lines for the perforated tile
                    for (let j = yPosition; j <= yPosition + 1; j += 0.1) {
                        const perftiles = [];
                        perftiles.push(new THREE.Vector3(xPosition - floorWidth / 2, 0.01, j - floorHeight / 2));
                        perftiles.push(new THREE.Vector3(xPosition + 1 - floorWidth / 2, 0.01, j - floorHeight / 2));
        
                        const lineGeometry = new THREE.BufferGeometry().setFromPoints(perftiles);
                        const perfLine = new THREE.Line(lineGeometry, lineMat);
                        perforatedTileGroup.add(perfLine);
                    }

                    // Add the group to the scene and make it clickable
                    scene.add(perforatedTileGroup);
                    clickableObjects.push(perforatedTileGroup);
                } else {
                    console.error("Invalid figure dimensions:", figureData);
                }
            } catch (error) {
                console.error("Error rendering figure:", error);
            }
        });
    });
}

// Function to add a label to a figure in the 3D scene
function addLabel(text, figureMesh, font) {
    // Set the size and height of the text label
    const textSize = 0.2;
    const textHeight = 0.05;

    // Create a geometry for the text using the specified font, size, and height
    const textGeometry = new TextGeometry(text, {
        font: font,
        size: textSize,
        height: textHeight,
    });

    // Compute the bounding box of the text geometry to determine its dimensions
    textGeometry.computeBoundingBox();
    const boundingBox = textGeometry.boundingBox;

    // Extract the width and height of the text from the bounding box
    const textWidth = boundingBox.max.x - boundingBox.min.x;
    const textHeightVal = boundingBox.max.y - boundingBox.min.y;

    // Create a material for the text with a black color
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    // Create a mesh for the text by combining the geometry and material
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Calculate the bounding box of the figure mesh to determine its dimensions
    const bbox = new THREE.Box3().setFromObject(figureMesh);
    const figureHeight = bbox.max.y - bbox.min.y;
    const figureWidth = bbox.max.x - bbox.min.x;
    const figureDepth = bbox.max.z - bbox.min.z;

    // Initialize variables for the label's position
    let labelX;
    let labelY;
    let labelZ;
    let labelAngle = figureMesh.userData.figureAngle;

    console.log('Label Angle:', labelAngle);
    console.log('Figure Width:', figureMesh.userData.figureWidth);

    // Set the rotation of the text mesh to match the figure's rotation
    textMesh.rotation.y = figureMesh.rotation.y;

    // Adjust the label's position based on the type of figure
    switch (figureMesh.userData.figureName) {
        case 'rack':
            // For 'rack' figures, adjust the rotation of the label further
            textMesh.rotation.y = figureMesh.rotation.y + 3 * Math.PI / 2;
            if (labelAngle == 0) {
                labelX = figureMesh.position.x + figureWidth / 4;
                labelY = figureMesh.position.y + figureHeight + 0.5;
                labelZ = figureMesh.position.z - figureDepth / 4;                
            } else if (labelAngle == 90) {
                labelX = figureMesh.position.x - figureWidth / 8;
                labelY = figureMesh.position.y + figureHeight + 0.5;
                labelZ = figureMesh.position.z;
            } else if (labelAngle == 180) {
                labelX = figureMesh.position.x + figureWidth / 8;
                labelY = figureMesh.position.y + figureHeight + 0.5;
                labelZ = figureMesh.position.z;
            } else if (labelAngle == 270) {
                labelX = figureMesh.position.x + figureDepth / 10;
                labelY = figureMesh.position.y + figureHeight + 0.5;
                labelZ = figureMesh.position.z + figureWidth / 10;
            }
            break;
        case 'cooler':
            // For 'cooler' figures, adjust the label position based on the angle
            if (labelAngle == 0) {
                labelX = figureMesh.position.x + figureWidth / 2;
                labelY = figureMesh.position.y + figureHeight + 0.2;
                labelZ = figureMesh.position.z - figureDepth / 2;
            } else if (labelAngle == 90) {
                labelX = figureMesh.position.x - figureWidth / 2;
                labelY = figureMesh.position.y + figureHeight + 0.2;
                labelZ = figureMesh.position.z - figureDepth / 2;
            } else if (labelAngle == 180) {
                labelX = figureMesh.position.x - figureWidth / 2.45;
                labelY = figureMesh.position.y + figureHeight + 0.2;
                labelZ = figureMesh.position.z + figureDepth / 2;
            } else if (labelAngle == 270) {
                labelX = figureMesh.position.x + figureWidth / 2;
                labelY = figureMesh.position.y + figureHeight + 0.2;
                labelZ = figureMesh.position.z + figureDepth / 2;
            }
            break;
        case 'raised_floor':
            // For 'raised_floor' figures, position the label above and to the side of the figure
            labelX = figureMesh.position.x - figureWidth;
            labelY = figureMesh.position.y + figureHeight + 0.15;
            labelZ = figureMesh.position.z + floorWidth;
            break;
        case 'electrical_panel':
            // For 'electrical_panel' figures, position the label directly above the figure
            labelX = figureMesh.position.x;
            labelY = figureMesh.position.y + figureHeight - 0.2;
            labelZ = figureMesh.position.z;
            break;
        default:
            // Log a message if the figure type does not have a label
            console.log('This model does not have a label');
            break;
    }

    // Center the text label horizontally above the figure
    textMesh.position.set(
        labelX - textWidth / 2, // Center the label horizontally on the figure
        labelY,
        labelZ
    );

    // Add the text mesh to the scene
    scene.add(textMesh);

    // Map the figure mesh to its corresponding label in the figureLabelMap
    figureLabelMap.set(figureMesh, { textMesh });
}

// Event listener to handle clicks on objects in the 3D scene
document.addEventListener('click', function onClick(event) {
    const container3D = document.getElementById('container3D');
    const rightSidebar = document.getElementById('rightSideBar');
    const rect = container3D.getBoundingClientRect();
    const sidebarRect = rightSidebar.getBoundingClientRect();
    if (!container3D) {
        console.error('container3D element not found.');
        return;
    }

    // Check if the click is within the container3D div
    if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
    ) {
        // Prevent the default action for clicks within the container3D div
        event.preventDefault();

        // Calculate the mouse position and set up the raycaster for detecting intersections
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Check for intersections between the raycaster and clickable objects
        const intersects = raycaster.intersectObjects(clickableObjects, true);

        if (intersects.length > 0) {
            const intersect = intersects[0];
            clickedFigure = intersect.object;

            // Traverse up the group hierarchy if necessary to find the root figure
            while (clickedFigure && !(clickedFigure.userData && clickedFigure.userData.figureName)) {
                clickedFigure = clickedFigure.parent;
            }

            if (clickedFigure && clickedFigure.userData && clickedFigure.userData.figureName) {
                console.log("Figure Clicked:", clickedFigure.userData.figureName);
                console.log("ID:", clickedFigure.userData.figureId);

                // Show the right sidebar and the appropriate controls for the clicked figure
                rightSidebar.style.display = 'block';
                controls_side.style.display = 'flex';
                if (clickedFigure.userData.figureName !== 'rack') {
                    document.getElementById('viewFigure').style.display = 'none';
                } else {
                    document.getElementById('viewFigure').style.display = 'block';
                }
                editForm.style.display = 'none';

                document.getElementById('figureNameDisplay').innerHTML = `Figure: ${clickedFigure.userData.figureType}`;

            } else {
                console.log("No figureName found on clicked object.");
            }
        }
    }
});

console.log("clickedFigure", clickedFigure); 

// Event listener to close the right sidebar when the close button is clicked
document.getElementById('closeSidebar').addEventListener('click', function() {
    document.getElementById('rightSideBar').style.display = 'none';
});

// Function to delete a figure from the scene and database
function deleteFigure(clickedFigure) {
    console.log('figure name', clickedFigure.userData.figureName);
    if (true) {
        // Remove the figure from the scene
        scene.remove(clickedFigure);

        // Remove the figure from the clickable objects array
        const index = clickableObjects.indexOf(clickedFigure);
        if (index !== -1) {
            clickableObjects.splice(index, 1);
        }

        // Remove the label associated with the figure
        const label = figureLabelMap.get(clickedFigure);
        if (label) {
            scene.remove(label.textMesh);
            figureLabelMap.delete(clickedFigure);
        }

        console.log('ID:', clickedFigure.userData.figureId);
        console.log('name: ', clickedFigure.userData.figureName);

        // Send a DELETE request to remove the figure from the database
        fetch(`/delete_figure/${clickedFigure.userData.figureId}/`, {
            method: 'DELETE',
        }).then(response => {
            if (!response.ok) {
                console.error('Failed to delete the figure from the database');
            }
        }).catch(error => {
            console.error('Error:', error);
        });
    }
}

// Function to update the floor dimensions after a figure is deleted
function updateFloorDimensionsAfterDeletion() {
    maxX = 0;
    maxY = 0;

    // Iterate over all clickable objects to determine the new maximum dimensions
    clickableObjects.forEach((figureMesh) => {
        let figureWidth = figureMesh.userData.figureWidth;
        let figureDepth = figureMesh.userData.figureDepth;
        let figurePositionX = figureMesh.userData.x_position;
        let figurePositionY = figureMesh.userData.y_position;
        let figureAngle = figureMesh.userData.figureAngle;

        var figureMaxX = figurePositionX;
        var figureMaxY = figurePositionY;

        if (figureAngle == 0 || figureAngle == 180) {
            figureMaxX += figureWidth;
            figureMaxY += figureDepth;
        } else if (figureAngle == 90 || figureAngle == 270) {
            figureMaxX += figureDepth;
            figureMaxY += figureWidth;
        }

        // Update the maxX and maxY based on the figure's position and dimensions
        if (figureMaxX > maxX) {
            maxX = figureMaxX;
        }
        if (figureMaxY > maxY) {
            maxY = figureMaxY;
        }
    });

    console.log('Updated maxX:', maxX);
    console.log('Updated maxY:', maxY);

    // Set the new minimum dimensions for the floor
    document.getElementById('floorWidth').setAttribute("min", maxX);
    document.getElementById('floorHeight').setAttribute("min", maxY);
}

// Event listener to handle figure deletion when the delete button is clicked
document.getElementById('deleteFigure').addEventListener('click', function() {
    if (clickedFigure) {
        const figurename = clickedFigure.userData.figureType;
        const confirmation = confirm(`Delete the selected figure ${figurename}?`);
        if (confirmation) {
            document.getElementById('rightSideBar').style.display = 'none';
            deleteFigure(clickedFigure);
            updateFloorDimensionsAfterDeletion();
            clickedFigure = null;
        }
    } else {
        alert("Please select a figure to delete.");
    }
});

// Event listener to toggle the visibility of the figure data section
document.getElementById('figureType').addEventListener('click', function(event) {
    objToRender = event.target.value;
    const figureDataDiv = document.getElementById('figureData');
    switcher = !switcher;
    if (switcher) {
        figureDataDiv.style.display = 'block';
    } else {
        figureDataDiv.style.display = 'none';
    }
});

/////////////////  Edit part  ////////////////////////

// Function to display the edit form for the selected figure
function showEditForm(figure) {

    controls_side.style.display = 'none';
    editForm.style.display = 'block';

    const figureData = figure.userData;
    const editXInput = document.getElementById('edit_x_position');
    const editYInput = document.getElementById('edit_y_position');
    const editWidthInput = document.getElementById('edit_width');
    const editHeightInput = document.getElementById('edit_height');
    const editDepthInput = document.getElementById('edit_depth');
    const editAngleInput = document.getElementById('edit_angle');
    const editColorInput = document.getElementById('edit_color');

    // Populate the edit form with the figure's current data
    editXInput.value = figureData.x_position;
    editYInput.value = figureData.y_position;
    editWidthInput.value = figureData.figureWidth;
    editHeightInput.value = figureData.figureHeight;
    editDepthInput.value = figureData.figureDepth;
    editAngleInput.value = THREE.MathUtils.radToDeg(figure.rotation.y);
    editColorInput.value = figureData.figureColor;

    // Function to update the maximum allowed values for the edit inputs based on the figure's angle and size
    function updateEditMaxValues() {
        const xValue = parseFloat(editXInput.value);
        const yValue = parseFloat(editYInput.value);
        const widthValue = parseFloat(editWidthInput.value);
        const depthValue = parseFloat(editDepthInput.value);
        const angleValue = parseFloat(editAngleInput.value);

        let xInputMax, yInputMax;

        if (angleValue === 0 || angleValue === 180) {
            xInputMax = xValue + widthValue;
            yInputMax = yValue + depthValue;
        } else if (angleValue === 90 || angleValue === 270) {
            xInputMax = xValue + depthValue;
            yInputMax = yValue + widthValue;
        }

        if (xInputMax > floorWidth) {
            editXInput.max = floorWidth - widthValue;
        } else {
            editXInput.max = floorWidth;
        }

        if (yInputMax > floorHeight) {
            editYInput.max = floorHeight - depthValue;
        } else {
            editYInput.max = floorHeight;
        }

        // Set the edit error flag if the inputs exceed the allowed range
        if (editXInput.max != floorWidth || editYInput.max != floorHeight || xValue > floorWidth || yValue > floorHeight) {
            editError = 1;
        } else {
            editError = 0;
        }

        console.log('Edit Error: ', editError);
    }

    // Add event listeners to the edit inputs to update the max values whenever they change
    [editXInput, editYInput, editWidthInput, editDepthInput, editAngleInput].forEach(input => {
        input.addEventListener('input', updateEditMaxValues);
    });

    // Set the initial max values when the form is first shown
    updateEditMaxValues();

    // Hide irrelevant fields for specific figure types (e.g., perforated_tile, raised_floor)
    if (figureData.figureName === 'perforated_tile' || figureData.figureName === 'raised_floor') {
        document.getElementById('whole_edit_width').style.display = 'none';
        document.getElementById('whole_edit_height').style.display = 'none';
        document.getElementById('whole_edit_depth').style.display = 'none';
        document.getElementById('whole_edit_angle').style.display = 'none';
        document.getElementById('whole_edit_color').style.display = 'none';
    }

    // Event listener to handle the save action when the save button is clicked
    document.getElementById('saveChanges').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default form submission behavior

        const form = document.getElementById('editForm');

        // Check if the form is valid before proceeding
        if (!form.checkValidity()) {
            form.reportValidity(); // Show validation messages
            return; // Stop the function if the form is invalid
        }

        console.log('Before Confirmation Edit Error: ', editError);
        if (editError == 0) {
            const confirmation = confirm(`Update the selected figure '${clickedFigure.userData.figureType}'?`);
            if (confirmation) {
                saveChanges(clickedFigure);
                clickedFigure = null;
            }
        }
    });
}

// Event listener to handle the form submission for editing a figure
document.getElementById('editForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const form = event.target;

    // Check if the form is valid before proceeding
    if (!form.checkValidity()) {
        form.reportValidity(); // Show validation messages
        return; // Stop the function if the form is invalid
    }

    // Confirm and save the changes if the form is valid
    const confirmation = confirm(`Update the selected figure '${clickedFigure.userData.figureType}'?`);
    if (confirmation) {
        saveChanges(clickedFigure);
        clickedFigure = null; // Reset the clickedFigure
    }
});

// Function to save the changes made to a figure
function saveChanges(figure) {
    // Create an object to hold the updated figure data
    const figureData = {
        x_position: parseFloat(document.getElementById('edit_x_position').value),
        y_position: parseFloat(document.getElementById('edit_y_position').value),
        width: parseFloat(document.getElementById('edit_width').value),
        height: parseFloat(document.getElementById('edit_height').value),
        depth: parseFloat(document.getElementById('edit_depth').value),
        angle: parseFloat(document.getElementById('edit_angle').value),
        color: document.getElementById('edit_color').value,
    };

    // Send a PUT request to update the figure in the database
    if (figure.userData.figureId) {
        fetch(`/edit_figure/${figure.userData.figureId}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': null
            },
            body: JSON.stringify(figureData)
        }).then(response => {
            if (!response.ok) {
                console.error('Failed to edit the figure in the database');
            } else {
                console.log('Figure edited successfully');
                window.location.reload(); // Reload the page to reflect changes
            }
        }).catch(error => {
            console.error('Error:', error);
        });
    }
}

// Event listener to view or assign the rack associated with a figure
document.getElementById('viewFigure').addEventListener('click', function viewInfo() {
    const selectedFigure = {
        rack_id: clickedFigure.userData.rack_id,
        id: clickedFigure.userData.figureId,
        site_name: floorSiteName,
        floor_name: floorName
    };

    console.log(selectedFigure);

    // Redirect to the appropriate page based on whether the rack is assigned
    if (selectedFigure.rack_id === 0) {
        window.location.href = `/mtx/assign_rack/${selectedFigure.site_name}/${selectedFigure.floor_name}/${selectedFigure.id}`;
    } else {
        window.location.href = `/mtx/edit_rack/${selectedFigure.site_name}/${selectedFigure.floor_name}/${selectedFigure.rack_id}`;
    }
});

// Event listener to show the edit form when the edit button is clicked
document.getElementById('editFigure').addEventListener('click', function() {
    if (clickedFigure) {
        showEditForm(clickedFigure);
    } else {
        alert("Please select a figure to edit.");
    }
});

// Event listener to handle changes in the figure type dropdown
document.getElementById('figure_name').addEventListener('change', function () {
    const figureNameSelect = document.getElementById('figure_name');
    const widthInput = document.getElementById('width');
    const depthInput = document.getElementById('depth');
    const heightInput = document.getElementById('height');
    const figureTypeInput = document.getElementById('figure_type');
    const colorInput = document.getElementById('figure_color');
    const angleInput = document.getElementById('angle');

    const selectedFigure = figureNameSelect.value;
    
    // Adjust the input fields based on the selected figure type
    if (selectedFigure === 'perforated_tile' || selectedFigure === 'raised_floor') {
        widthInput.value = 1;
        depthInput.value = 1;
        if (selectedFigure === 'perforated_tile') {
            heightInput.value = 0;
            figureTypeInput.value = 'Perforated Tile';
        } else {
            heightInput.value = 1;
            figureTypeInput.value = 'Raised Floor';
        }
        // Hide inputs that are not relevant for these figure types
        widthInput.parentElement.style.display = 'none';
        depthInput.parentElement.style.display = 'none';
        heightInput.parentElement.style.display = 'none';
        figureTypeInput.parentElement.style.display = 'none';
        colorInput.parentElement.style.display = 'none';
        angleInput.parentElement.style.display = 'none';
    } else {
        // Show inputs for other figure types
        widthInput.parentElement.style.display = '';
        depthInput.parentElement.style.display = '';
        heightInput.parentElement.style.display = '';
        figureTypeInput.parentElement.style.display = '';
        colorInput.parentElement.style.display = '';
        angleInput.parentElement.style.display = '';
    }
});

// Event listener to update the max values for inputs when the page is loaded
document.addEventListener('DOMContentLoaded', function () {
    const xInput = document.getElementById('x_position');
    const yInput = document.getElementById('y_position');
    const widthInput = document.getElementById('width');
    const depthInput = document.getElementById('depth');
    const angleInput = document.getElementById('angle');

    // Function to update the max allowed values for the inputs
    function updateMaxValues() {
        const xValue = parseFloat(xInput.value);
        const yValue = parseFloat(yInput.value);
        const widthValue = parseFloat(widthInput.value);
        const depthValue = parseFloat(depthInput.value);
        const angleValue = parseFloat(angleInput.value);

        let xInputMax, yInputMax;

        if (angleValue === 0 || angleValue === 180) {
            xInputMax = xValue + widthValue;
            yInputMax = yValue + depthValue;
        } else if (angleValue === 90 || angleValue === 270) {
            xInputMax = xValue + depthValue;
            yInputMax = yValue + widthValue;
        }

        if (xInputMax > floorWidth) {
            xInput.max = floorWidth - widthValue;
        } else {
            xInput.max = floorWidth;
        }

        if (yInputMax > floorHeight) {
            yInput.max = floorHeight - depthValue;
        } else {
            yInput.max = floorHeight;
        }
    }

    // Add event listeners to update the max values when the inputs change
    [xInput, yInput, widthInput, depthInput, angleInput].forEach(input => {
        input.addEventListener('input', updateMaxValues);
    });

    // Set the initial max values when the page is loaded
    updateMaxValues();
});

// Function to animate the scene, called on each frame
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera); // Render the scene with the camera
}

// Event listener to handle window resize events
window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // Update the camera's aspect ratio
    renderer.setSize(window.innerWidth, window.innerHeight); // Adjust the renderer size
});

// Start the animation loop
animate();