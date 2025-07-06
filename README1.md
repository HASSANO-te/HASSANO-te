Advanced Stellar Evolution Simulator
A dynamic, interactive web-based simulator that visualizes the characteristics and evolutionary paths of stars based on user-defined parameters like mass, gravity, and fuel.
(You should replace this with a screenshot of your actual running application!)
🚀 About The Project
This project is an educational tool designed to make the fascinating concepts of stellar evolution accessible and visually engaging. By manipulating simple sliders, users can instantly see how a star's core properties determine its appearance, its type (from a Red Dwarf to a massive Blue Supergiant), and its ultimate fate—whether it will fade away as a White Dwarf, collapse into a Neutron Star, or form a Black Hole.
The simulation is rendered in real-time on an HTML5 Canvas, featuring dynamic animations for star activity, nebulae, accretion disks, and more.
Live Demo
➡️ View Live Demo Here
(Note: You can easily host this for free on GitHub Pages)
✨ Features
Interactive Controls: Adjust a star's initial Mass, Gravity Influence, and Hydrogen Fuel percentage with intuitive sliders.
Real-time Visualization: The star's appearance, size, color, and activity level update instantly on the HTML Canvas.
Dynamic Star Types: The simulation correctly identifies and renders various stellar types, including:
Protostars
Main Sequence Stars (Red, Yellow, Blue)
Red Giants and Supergiants
O-Type Supergiants
End-of-Life Scenarios: Witness the dramatic final stages of a star's life:
Planetary Nebulae with a White Dwarf core
Pulsing Neutron Stars
Black Holes with animated accretion disks
Supernova Remnants
Informative Display: A dedicated panel provides detailed information, including a procedurally generated star designation, its current type, physical description, and its probable evolutionary path.
Immersive Environment: Features a twinkling starfield background and responsive zoom controls (buttons and mouse wheel) to inspect the star up close.
Pure Front-End: Runs entirely in the browser with no server-side dependencies.
🛠️ How to Use
Open the application in your web browser.
Adjust the Sliders:
Mass (M☉): Set the star's mass relative to our Sun. This is the primary factor in its evolution.
Gravity Influence: Modify the gravitational constant to see how it affects the star's "effective mass" and activity.
Hydrogen %: Simulate the star at different points in its life by changing its available fuel. Low hydrogen represents an older star.
Observe the Changes: Watch the star on the canvas transform in real-time.
Read the Info Panel: Learn about the current state of your simulated star and its future.
Use the Zoom Controls: Use the + / - buttons or your mouse wheel over the canvas to zoom in and out.
⚙️ Local Setup
To run this project on your local machine, follow these simple steps.
Clone the repository:
Generated sh
git clone https://github.com/your-username/your-repo-name.git
Use code with caution.
Sh
Navigate to the project directory:
Generated sh
cd your-repo-name
Use code with caution.
Sh
Open the index.html file in your browser.
You can simply double-click the file, or right-click and choose "Open with" your preferred browser.
No web server or other dependencies are required!
📂 File Structure
The project is organized into three distinct files, following standard web development best practices:
Generated code
/
├── index.html   # The main HTML file containing the page structure and all elements.
├── style.css    # The CSS file for all styling, layout, and visual appearance.
└── script.js    # The JavaScript file containing all the simulation logic, canvas drawing, and interactivity.
Use code with caution.
💻 Technologies Used
HTML5: For the core structure of the web page.
CSS3: For styling, layout (Flexbox), and custom slider appearances.
JavaScript (ES6+): For the entire simulation logic, DOM manipulation, and event handling.
HTML5 Canvas API: For rendering all the dynamic 2D graphics and animations.
📄 License
This project is licensed under the MIT License. See the LICENSE file for details (or simply state it here if you don't have a separate file).
