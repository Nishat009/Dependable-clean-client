import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { UserContext } from '../../App';
import Sidebar from '../Dashboard/Sidebar/Sidebar';
import Navbar from '../Shared/Navbar/Navbar';


const AddReview = () => {
    const [loggedInUser, setLoggedInUser] = useContext(UserContext);
    const { register, handleSubmit, formState: { errors } } =useForm();



    const onSubmit = data => {
        const reviewDetails = {
            name: loggedInUser.name,
            userImg: loggedInUser.photoURL,
            comments: data.comments
        }
        fetch('http://localhost:5000/addReview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewDetails)
        })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    alert('successfully done')
                }
            });
    };



    return (
        <div className="fluid-container">
            <Navbar></Navbar>
            <div className="row mx-0">
                <div className='col-md-2 p-0'>
                    <Sidebar></Sidebar>
                </div>
                <div className="col-md-10 p-4 mx-auto">
                    <h1 className="border-bottom mb-2">Review</h1>
                    <form onSubmit={handleSubmit(onSubmit)} className="row  bg-warning shadow mt-5 p-5 rounded container shadow">
                        <div class="row mb-3">
                            <label for="inputEmail3" class="col-sm-2 col-form-label">User Name</label>
                            <div class="col-sm-10">
                                <input name="name" defaultValue={loggedInUser.name} {...register('name')} className="form-control" />
                            </div>
                        </div>

                       

                        <div class="row mb-3">
                            <label for="inputEmail3" class="col-sm-2 col-form-label">Comments</label>
                            <div class="col-sm-10">
                                <textarea name="comments" placeholder="write your opinion....." {...register('comments')} id="" cols="100" rows="5" required ></textarea>
                                {errors.comments && <span style={{ color: 'red' }}>This field is required</span>}
                            </div>
                        </div>
                        <div class="row mb-3 d-flex content-justify-between">
                            <div className="col-md-6">
                            <button className="btn btn-primary" type="submit">Submit</button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddReview;