use std::{fs, io::Read, path::PathBuf};

fn main() {
    let file_name = env::args().nth(1).expect("Please provide a file name");
    let file_name = PathBuf::from(file_name);
    let file_content = fs::read_to_string(file_name.clone()).expect("Failed to read the file");

    let bump = bumpalo::Bump::new();

    let mut entity_resolver = move |_pub_id: Option<&str>, uri: &str| {
        let root_dir = file_name.parent().unwrap().to_path_buf();
        let mut entity_file_path = root_dir;
        entity_file_path.push(uri);

        // Get the metadata of the file to get its size.
        if !entity_file_path.exists() {
            return Ok(None);
        }
        let entity_file_metadata =
            fs::metadata(&entity_file_path).expect("Failed to get entity file metadata");
        let entity_file_size = entity_file_metadata.len();

        // Get the layout to store the file content.
        let layout = std::alloc::Layout::from_size_align(entity_file_size as usize, 1)
            .expect("Failed to create layout for entity file content");

        // Allocate memory in the bump arena.
        let entity_file_content_ptr = bump.alloc_layout(layout).as_ptr() as *mut u8;

        // Read the file content into the allocated memory.
        //
        // SAFETY: We have allocated enough memory for the file content.
        unsafe {
            let entity_file_content_slice =
                std::slice::from_raw_parts_mut(entity_file_content_ptr, entity_file_size as usize);
            fs::File::open(&entity_file_path)
                .expect("Failed to open the entity file")
                .read_exact(entity_file_content_slice)
                .expect("Failed to read the entity file content");
        }

        // Return the file content as a &str.
        Ok(Some(unsafe {
            std::str::from_utf8_unchecked(std::slice::from_raw_parts(
                entity_file_content_ptr,
                entity_file_size as usize,
            ))
        }))
    };

    let doc = roxmltree::Document::parse_with_options(
        &file_content,
        roxmltree::ParsingOptions {
            allow_dtd: true,
            entity_resolver: Some(&mut entity_resolver),
            ..Default::default()
        },
    )
    .unwrap();
    println!("{:#?}", doc);
}
