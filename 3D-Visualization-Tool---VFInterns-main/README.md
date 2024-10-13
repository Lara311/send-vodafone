# 3D Floor Plan Visualization with Django and Three.js

## Project Overview

This project is a web-based 3D floor plan visualization tool built using Django for the backend and Three.js for the frontend 3D rendering. Users can view, add, edit, and delete figures (e.g., racks, coolers, etc.) on a floor plan in a 3D environment.

## System Requirements

- **Python**: 3.7 or higher
- **Django**: 3.2 or higher

## Project Structure

``` bash
Three/
│
├── myapp/
│   ├── migrations/
│   ├── static/
│   │   ├── myapp/
│   │   │   ├── images/
│   │   │   ├── styles.css
│   │   │   ├── script.js
│   ├── templates/
│   │   ├── myapp/
│   │   │   ├── floor_view.html
│   │   │   ├── floor_dropdown.html
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   ├── apps.py
│   ├── tests.py
├── manage.py
├── db.sqlite3
├── requirements.txt
```
## Detailed Workflow
### A. Backend (Django)
- **Models:**
  * Floor: Represents a floor with attributes like width, length, color, grid settings, and associated site name.
  * Figure: Represents objects on the floor (e.g., racks, coolers), with attributes like position, dimensions, angle, and color.
- **Views:**
  * floor_view: Renders the 3D view of the floor with associated figures.
  * add_figure, edit_figure, delete_figure: Handle the CRUD operations for figures.
- **Templates:**
  * floor_view.html: Displays the 3D model and controls for interaction.
  * floor_dropdown.html: Dropdown menu for selecting floors.
  
### B. Frontend (Three.js)
- **Three.js and its modules:**
  * three.module.js: Core Three.js library.
  * OrbitControls.js: Allows user to orbit around the 3D scene.
  * GLTFLoader.js: Loads 3D models in GLTF format.
  * TextGeometry: Used for adding text labels to figures.
    
- **3D Rendering:**
  * Initializes a 3D scene using Three.js.
  * Loads floor data and figures from Django.
  * Allows interaction such as adding, editing, or deleting figures.

## Explanation of Key Files
### A. models.py
Defines the data structure for the project, including Floor and Figure.

### B. views.py
Handles requests and responses, rendering the appropriate templates with the required context.

### C. floor_view.html
Main template for visualizing and interacting with the 3D floor plan.

### D. script.js
Handles all the client-side logic for rendering the 3D scene, including interactions like adding and editing figures.

## Required JavaScript Packages:
- **Three.js:** A JavaScript library used to create and display animated 3D graphics in a web browser.
```bash
npm install three
```

- **OrbitControls:** A Three.js add-on that allows the camera to orbit around a target.
```bash
npm install three-orbitcontrols
```

- **GLTFLoader:** A Three.js loader used for loading 3D models in the GLTF format.
```bash
npm install three-gltf-loader
```

- **FontLoader and TextGeometry:** These are part of the Three.js library and are used for loading and rendering 3D text within the scene, These will be available after installing the Three.js package as shown above. If you're using the modules from a CDN, they are included in the Three.js library.
  
``` bash
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FontLoader, TextGeometry } from 'three';
```
