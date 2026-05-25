'use client';

import Link from "next/link";

function ThreadsSection() {
    return (  
        <div>
            <Link href={"/threads/new"}>New thread</Link>
        </div>
    );
}

export default ThreadsSection;