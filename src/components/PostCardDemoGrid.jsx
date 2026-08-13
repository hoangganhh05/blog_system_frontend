import React from 'react';
import PostCardDemo from './PostCardDemo';

const PostCardDemoGrid = ({ posts }) => {
  return (
    <div className="w-full">
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCardDemo key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default PostCardDemoGrid;
