use std::{sync::LazyLock, thread, time};

pub static RT: LazyLock<tokio::runtime::Runtime> = LazyLock::new(|| {
    tokio::runtime::Runtime::new()
        .expect("failed to build runtime")
});

fn main() {
    let handle = RT.handle();
    handle.spawn(async {
        async_something().await;
    });
    // thread::sleep(time::Duration::from_secs(60));
}
