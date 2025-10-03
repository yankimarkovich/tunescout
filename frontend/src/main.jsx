import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode> 
    <App />
  </StrictMode>,
)





//  Step 3: main.jsx executes this code:
// javascriptReactDOM.createRoot(document.getElementById('root'))

// Let me break down what document.getElementById('root') does:
// document = the entire webpage
// .getElementById('root') = find the element with id="root"
// Returns the <div id="root"></div> element (even though it's empty)

// Step 4: React then does:
// javascript.render(<App />)
// This says: "Take the <App /> component and put it INSIDE that empty div"
// After React renders, the HTML becomes:

{/* <div id="root">
  React puts your entire app here
  <div class="login-container">
    <div class="login-content">
      <h1>🎵 TuneScout</h1>
      ...all your components...
    </div>
  </div>
</div> */}


// Think of it like this:
// The <div id="root"> is like an empty picture frame
// React is the artist who paints inside that frame
// The painting (your app) appears AFTER the JavaScript runs 



//StrictMode is a development helper that doesn't render anything visible. It's like a "safety checker" that:
//Warns you about unsafe code - If you use old/deprecated React features
//Checks for side effects - Runs some functions twice on purpose to catch bugs
//Only works in development - When you deploy to production, it disappears automatically
//Think of it like a spell-checker in Word - it helps you while writing, but doesn't appear in the final document.