
import React from 'react'
import HeaderMainSlider from '../Header/HeaderMainSlider/HeaderMainSlider'

import './HeaderMain.css'

function HeaderMain() {
  
  return (
    <main style={{height:'600px'}} className="row d-flex align-items-center w-100">
    <div className="col-md-4 offset-md-1 sideWrite">
        <h1 style={{color:'#3A4256'}}>Cleaning Is The <br/> Start of New Journey</h1>
        <p className="text-secondary">Lorem ipsum dolor sit amet consectetur adipisicing elit. Libero temporibus aperiam, voluptatum hic dolores earum!</p>
        <button style={{backgroundImage: "linear-gradient(90deg, #86ebe7, #3A4256)"}}class="btn text-white">GET STARTED</button>
    </div>
    <div className="col-md-6">
      <HeaderMainSlider></HeaderMainSlider>
    </div>
</main>
  )
}

export default HeaderMain;