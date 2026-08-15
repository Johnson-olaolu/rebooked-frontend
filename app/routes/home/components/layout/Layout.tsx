import React from 'react'
import { Outlet } from 'react-router'

const HomeLayout = () => {
    return (
        <div>
            <div className="">Header</div>
            <Outlet />
            <div className="">Footer</div>
        </div>
    )
}

export default HomeLayout