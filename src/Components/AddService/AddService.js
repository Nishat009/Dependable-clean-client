import React, { useState } from 'react';
import Sidebar from '../Dashboard/Sidebar/Sidebar';
import Navbar from '../Shared/Navbar/Navbar';

const AddService = () => {
    const [info, setInfo] = useState({});
    const [file, setFile] = useState(null);
    const handleBlur = e => {
        const newInfo = { ...info };
        newInfo[e.target.name] = e.target.value;
        setInfo(newInfo);
    }

    const handleFileChange = (e) => {
        const newFile = e.target.files[0];
        setFile(newFile);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData()
        console.log(info);
        formData.append('file', file);
        formData.append('serviceName', info.serviceName);
        formData.append('price', info.price);
        formData.append('details', info.details);

        fetch('http://localhost:5000/addService', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                e.target.reset()
                if(data){
                    alert('successful');
                }
            })
    }

    return (
        <section className="container-fluid">

                <Navbar></Navbar>
                <div className="row">
                     <div className="col-md-2">
                    <Sidebar></Sidebar>
                </div>
            
            
            <div className="col-md-10 p-4 pr-5" style={{ position: "absolute", right: 0, backgroundColor: "#F4FDFB" }}>
                <h5 className="text-brand">Add a Service</h5>
                <form class="row g-3 bg-secondary shadow mt-5 p-5 rounded container shadow" onSubmit={handleSubmit}>
                        <div className="col-md-6">
                            <label class="form-label fw-bolder text-white">Name</label>
                            <input type="text" name="serviceName" onBlur={handleBlur} class="form-control" placeholder="Enter Name" />
                        </div>
                        <div className="col-md-6">
                            <label class="form-label fw-bolder text-white">Image</label>
                            <input class="form-control" onChange={handleFileChange}  type="file" name="picture"  />
                        </div>

                        

                        <div className="col-md-6">
                            <label class="form-label fw-bolder text-white">Details</label>
                            <textarea type="text" onBlur={handleBlur} name="details" class="form-control" style={{height:'15vh'}} placeholder="details" />
                        </div>
                        <div className="col-md-6">
                            <label class="form-label fw-bolder text-white">Price</label>
                            <input type="text" name="price" onBlur={handleBlur} class="form-control" placeholder="price" />
                        </div>
                        <div className="col-md-12 d-flex align-items-center">
                            <input type="submit" className="mt-3 btn btn-success" />
                        </div>
                    </form>

            </div>
                </div>
                
            
            
        </section>
    );
};

export default AddService;