const db = require('./database');

async function checkScheduledPosts() {
  console.log('=== Checking Scheduled Posts ===');
  
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const localNow = `${pad(now.getFullYear())}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  
  console.log('Current local time:', localNow);
  console.log('Current Date object:', now.toString());
  console.log('');
  
  // Check all posts first
  const allPosts = await db.all(
    `SELECT id, title, status, scheduled_time, published_at, created_at
     FROM posts ORDER BY created_at DESC LIMIT 10`
  );
  
  console.log('=== All Recent Posts ===');
  allPosts.forEach(post => {
    console.log(`  ID: ${post.id} | Status: ${post.status} | Title: ${post.title}`);
    console.log(`    Scheduled: ${post.scheduled_time || 'N/A'}`);
    console.log(`    Published: ${post.published_at || 'N/A'}`);
    console.log('');
  });
  
  const posts = await db.all(
    `SELECT id, title, status, scheduled_time, 
     CASE WHEN scheduled_time <= ? THEN 'READY' ELSE 'NOT YET' END as ready_status
     FROM posts WHERE status = 'scheduled'`,
    [localNow]
  );
  
  console.log('=== Scheduled Posts Only ===');
  if (posts.length === 0) {
    console.log('❌ No scheduled posts found');
  } else {
    console.log(`✓ Found ${posts.length} scheduled post(s):\n`);
    posts.forEach((post, idx) => {
      console.log(`Post #${idx + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Title: ${post.title}`);
      console.log(`  Scheduled For: ${post.scheduled_time}`);
      console.log(`  Ready Status: ${post.ready_status}`);
      
      // String comparison check
      const isReady = post.scheduled_time <= localNow;
      console.log(`  Comparison: "${post.scheduled_time}" <= "${localNow}" = ${isReady}`);
      
      if (isReady) {
        console.log('  ✓ This post WILL be auto-published by scheduler');
      } else {
        console.log('  ⏳ This post is WAITING for scheduled time');
        
        // Calculate time remaining
        try {
          const scheduledDate = new Date(post.scheduled_time);
          const diff = scheduledDate - now;
          if (diff > 0) {
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            console.log(`  Time remaining: ${hours}h ${minutes}m`);
          }
        } catch (e) {
          console.log('  (Could not calculate time remaining)');
        }
      }
      console.log('');
    });
  }
  
  console.log('=== Auto-Publish System Status ===');
  console.log('✓ Scheduler runs every 10 seconds');
  console.log('✓ Checks: scheduled_time <= current_time');
  console.log('✓ Time format: YYYY-MM-DDTHH:MM:SS');
  console.log('✓ Next check in: <10 seconds\n');
  
  process.exit(0);
}

checkScheduledPosts().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
