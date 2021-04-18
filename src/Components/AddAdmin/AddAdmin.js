import React, { useState } from 'react';
import Sidebar from '../Dashboard/Sidebar/Sidebar';
import Navbar from '../Shared/Navbar/Navbar';



const AddAdmin = () => {
    const [admin, setAdmin] = useState({})

    const handleBlur = e =>{
        const newInfo = {...admin}
        newInfo[e.target.name] = e.target.value;
        setAdmin(newInfo);
    }

    const handleSubmit = (e) =>{
        e.preventDefault();
        const formData = new FormData()

        formData.append('email', admin.email)

        fetch('http://localhost:5000/addAdmin', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if(data){
                e.target.reset();
                alert('Admin Created Successfully !');
            }
        })
        .catch(error => {
            console.error(error)
        })
    }
    return (
        <section className="container-fluid row " >
            <Navbar></Navbar>
            <div className="col-md-2">
               <Sidebar></Sidebar>
            </div>
            <div className="col-md-10 p-5 pr-5" style={{ backgroundColor: "#F4FDFB" }}>
                <h5 className="text-brand border-bottom">Add Admin</h5>
                <form onSubmit ={handleSubmit}>
                    <div class="form-group">
                        <label for="exampleInputEmail1">Email address</label>
                        <input onBlur ={handleBlur} type="email" class="form-control" name="email" placeholder="Enter email" />
                    </div>
                    <button type="submit" class="btn btn-primary">Submit</button>
                </form>
            </div>
        </section>
    );
};

export default AddAdmin;