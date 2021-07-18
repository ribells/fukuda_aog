// 
// Sample code for "Fukuda-Style Image Tiling" by Bengt-Olaf Schneider.
// Copyright Bengt-Olaf Schneider, 2021

// This file provides a sample implementation for creating a Fukuda-style rendering using a rectangle pattern.
// It encapsulates the actual drawing of the Fukuda image into draw_fukuda() which is called from P5's draw() routine.
// Thej draw() routine itself continually varies the strip_width to demonstrate a simple animation effect.
//
//
// Notes:
//
// This code uses P5.js, see www.p5js.org.
//
// For clarity, various parameters are hardcoded, including
// - image name and image dimensions
// - the orientation of the rectangular strips (vertical)
// - the number of strips
// - minimum and maximum percentage of the strip's width that can be filled
//

// -----------------------------------------------------------------------------------------------------------------
// Hardcoded, global parameters
let    img;
let    strip_width = 10;
let    img_w       = 515;
let    img_h       = 768;
let    step_size   = 1.0;
let    pct_min     = 10;
let    pct_max     = 100;
let    bimage      = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/515px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg"

// -----------------------------------------------------------------------------------------------------------------
// Utility functions

function get_intensity (idx, xoff, yoff)
{
    // Compute intensity of pixel at (xoff, yoff) relative to pixel starting at index.
  
    // Adjust idx by offset - each pixel as 4 bytes (RGB), each scanline has therefore 4*img_w bytes
    idx_off = idx + floor(yoff)*4*img_w + 4*floor(xoff);

    // Simplistic intensity calculation as R+B+G, range = [0 .. 3*255]
    return mona[idx_off] + mona[idx_off+1] + mona[idx_off+2];  
}

function FukudaRect() {
    // Define global parameters used by draw() function
    img_w = img.width;
    img_h = img.height;
    image(img, 0, 0, img_w, img_h);
    img.loadPixels();
    mona = img.pixels;
    
    stroke(20, 120, 210, 255);    // draw blue-ish strips
    strokeWeight(2);              // strips are drawin with 2 pixels lines
}

function draw_fukuda() {  
    // Clear the entire canvas before drawing the fan strips
    fill(255, 255, 220);
    rect(0, 0, img_w, img_h);
    
    x_orig = strip_width/2; // origin is at the strip's center
    y_orig = 0;
    
    // Iterate through all strips in the fan
    x = x_orig;
    y = y_orig;
    done_strips = false;
    while (!done_strips) {
        // Step through the image starting at the rectangle's origin.
        // Stop once the strip extends beyond the image bounds.
        done_lines = false;
        while (!done_lines) {
            mod_width = 0;  // modulated strip width
            index = 4 * (Math.floor(y)*img_w + Math.floor(x));  // for the anchor, index into the linear array of image pixels, each pixel has 4 bytes (RGBA)
            
            // Traversing left and right from the anchor point, traverse all pixels over the full width of the strip_width
            // Then, average their value to determine the modulated width of the strip.
            intensity = 0;
            for (off = -strip_width/2 ; off < strip_width/2 ; off++)
                intensity += get_intensity (index, off, 0);
            intensity = intensity/strip_width/785;  // to get the average intensity, divide by width of the strip and by the maximum intensity per pixel (3x255)
            
            // Scale intensity to the range [pct_min,pct_max]
            min_width = pct_min/100;
            max_width = pct_max/100;
            mod_width = strip_width * (intensity/(max_width - min_width) + min_width);
      
            // Draw a line with the length of the modulate strip width
            line (x - mod_width/2, y,
                  x + mod_width/2, y);

            // Done with this step, go to next anchor in the strip
            y += step_size;
            if (y > img_h) done_lines = true;
        }
        
        // Done with strip, move anchor to the next strip
        x += strip_width;
        y = y_orig;
        if (x > img_w) done_strips = true;
    }
}

// -----------------------------------------------------------------------------------------------------------------
// P5 global entry points

function preload() {
    img = loadImage(bimage);
}

function setup() {
    const canvas = createCanvas(img_w, img_h)
    strip_width_change = +1;
    FukudaRect();
}

function draw() {
    
    strip_width += strip_width_change;
    if (strip_width > 150) strip_width_change = -1;
    if (strip_width <   5) strip_width_change = +1;
    draw_fukuda();
}

function mousePressed() {
}

function keyPressed() {
    if (keyCode === ENTER) {}
}
