use std::collections::BTreeMap;

use indoc::indoc;
use rusqlite::Connection;

const VNODE_SIZE: usize = 4; // 4 is small, we use it just for test.

fn main() {
    let conn = get_conn();
    init_tables(&conn);

    let list_id = add_list(&conn);
    append_list(&conn, list_id, "item 0");
    append_list(&conn, list_id, "item 1");
    append_list(&conn, list_id, "item 2");
    show_list(&conn, list_id);
    // List:
    // - (at vnode 1, len = 3): ["item 0", "item 1", "item 2"]

    let list_id = add_list(&conn);
    for i in 0..16 {
        append_list(&conn, list_id, &format!("item {}", i));
    }
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 4): ["item 0", "item 1", "item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]

    insert_list(&conn, list_id, 0, "item -1");
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 2): ["item -1", "item 0"]
    // - (at vnode 6, len = 3): ["item 1", "item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]

    insert_list(&conn, list_id, 0, "item -2");
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 3): ["item -2", "item -1", "item 0"]
    // - (at vnode 6, len = 3): ["item 1", "item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]

    insert_list(&conn, list_id, 4, "item 1.5");
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 3): ["item -2", "item -1", "item 0"]
    // - (at vnode 6, len = 4): ["item 1", "item 1.5", "item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]

    insert_list(&conn, list_id, 4, "item 1.25");
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 3): ["item -2", "item -1", "item 0"]
    // - (at vnode 6, len = 2): ["item 1", "item 1.25"]
    // - (at vnode 7, len = 3): ["item 1.5", "item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]

    delitem_list(&conn, list_id, 4);
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 3): ["item -2", "item -1", "item 0"]
    // - (at vnode 6, len = 1): ["item 1"]
    // - (at vnode 7, len = 3): ["item 1.5", "item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]

    delitem_list(&conn, list_id, 4);
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 3): ["item -2", "item -1", "item 0"]
    // - (at vnode 6, len = 1): ["item 1"]
    // - (at vnode 7, len = 2): ["item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]

    delitem_list(&conn, list_id, 3);
    show_list(&conn, list_id);
    // List:
    // - (at vnode 2, len = 3): ["item -2", "item -1", "item 0"]
    // - (at vnode 7, len = 2): ["item 2", "item 3"]
    // - (at vnode 3, len = 4): ["item 4", "item 5", "item 6", "item 7"]
    // - (at vnode 4, len = 4): ["item 8", "item 9", "item 10", "item 11"]
    // - (at vnode 5, len = 4): ["item 12", "item 13", "item 14", "item 15"]
}

fn get_conn() -> Connection {
    Connection::open("foobar.sqlite3").unwrap()
}

fn init_tables(conn: &Connection) {
    conn.execute(
        indoc! { r#"
            CREATE TABLE IF NOT EXISTS lists (
                id INTEGER PRIMARY KEY,
                -- A simple JSON Array of vnodes' IDs.
                vnodes TEXT NOT NULL
            )
        "# },
        [],
    ).unwrap();
    conn.execute(
        indoc! { r#"
            CREATE TABLE IF NOT EXISTS vnodes (
                id INTEGER PRIMARY KEY,
                -- The length of the list nodes.
                length INTEGER NOT NULL,
                -- A simple JSON Array of nodes' IDs.
                nodes TEXT NOT NULL
            )
        "# },
        [],
    ).unwrap();
    conn.execute(
        indoc! { r#"
            CREATE TABLE IF NOT EXISTS nodes (
                id INTEGER PRIMARY KEY,
                value TEXT NOT NULL
            )
        "# },
        [],
    ).unwrap();
}

/// Add a new list to the database, return the ID of the list.
fn add_list(conn: &Connection) -> i64 {
    conn.execute(
        "INSERT INTO vnodes (length, nodes) VALUES (0, ?)",
        ["[]"],
    ).unwrap();
    let vnode_id = conn.last_insert_rowid();

    conn.execute(
        "INSERT INTO lists (vnodes) VALUES (?)",
        [format!("[{vnode_id}]")],
    ).unwrap();
    conn.last_insert_rowid()
}

/// Append a value to the list.
fn append_list(conn: &Connection, list_id: i64, value: &str) {
    // Get the list's vnodes.
    let mut vnodes: Vec<i64> = conn.query_row(
        "SELECT vnodes FROM lists WHERE id = ?",
        [list_id],
        |row| {
            let vnodes: String = row.get(0)?;
            Ok(serde_json::from_str(&vnodes).unwrap())
        },
    ).unwrap();

    // Get the metadata of the last vnode.
    let mut last_vnode_id = *vnodes.last().unwrap();
    let (mut last_vnode_length, mut last_vnode_nodes): (usize, Vec<i64>) = conn.query_row(
        "SELECT length, nodes FROM vnodes WHERE id = ?",
        [last_vnode_id],
        |row| {
            let length = row.get(0)?;
            let nodes: String = row.get(1)?;
            Ok((length, serde_json::from_str(&nodes).unwrap()))
        },
    ).unwrap();

    // If the last vnode is full, create a new vnode.
    if last_vnode_length as usize >= VNODE_SIZE {
        // Insert a new vnode.
        conn.execute(
            "INSERT INTO vnodes (length, nodes) VALUES (0, ?)",
            ["[]"],
        ).unwrap();
        let new_vnode_id = conn.last_insert_rowid();

        // Update the list's vnodes.
        vnodes.push(new_vnode_id);
        conn.execute(
            "UPDATE lists SET vnodes = ? WHERE id = ?",
            (serde_json::to_string(&vnodes).unwrap(), list_id),
        ).unwrap();

        // Update some variables.
        last_vnode_id = new_vnode_id;
        last_vnode_length = 0;
        last_vnode_nodes = vec![];
    }

    // Append the node.
    conn.execute(
        "INSERT INTO nodes (value) VALUES (?)",
        [value],
    ).unwrap();
    let node_id = conn.last_insert_rowid();

    // Update the last vnode.
    last_vnode_nodes.push(node_id);
    last_vnode_length += 1;
    conn.execute(
        "UPDATE vnodes SET length = ?, nodes = ? WHERE id = ?",
        (last_vnode_length, serde_json::to_string(&last_vnode_nodes).unwrap(), last_vnode_id),
    ).unwrap();
}

fn show_list(conn: &Connection, list_id: i64) {
    println!("List:");

    let vnodes: Vec<i64> = conn.query_row(
        "SELECT vnodes FROM lists WHERE id = ?",
        [list_id],
        |row| {
            let vnodes: String = row.get(0)?;
            Ok(serde_json::from_str(&vnodes).unwrap())
        },
    ).unwrap();

    for vnode_id in vnodes {
        let (length, nodes): (_, Vec<i64>) = conn.query_row(
            "SELECT length, nodes FROM vnodes WHERE id = ?",
            [vnode_id],
            |row| {
                let length: usize = row.get(0)?;
                let nodes: String = row.get(1)?;
                Ok((length, serde_json::from_str(&nodes).unwrap()))
            },
        ).unwrap();

        let mut values = vec![];
        for node_id in nodes {
            let value: String = conn.query_row(
                "SELECT value FROM nodes WHERE id = ?",
                [node_id],
                |row| row.get(0),
            ).unwrap();
            values.push(value);
        }
        println!("- (at vnode {}, len = {}): {:?}", vnode_id, length, values);
    }
}

/// Insert a value at the specified index of the list.
fn insert_list(conn: &Connection, list_id: i64, index: usize, value: &str) {
    // Get the list's vnodes.
    let mut vnodes: Vec<i64> = conn.query_row(
        "SELECT vnodes FROM lists WHERE id = ?",
        [list_id],
        |row| {
            let vnodes: String = row.get(0)?;
            Ok(serde_json::from_str(&vnodes).unwrap())
        },
    ).unwrap();

    // Get the length of vnodes.
    let mut stmt = conn.prepare(&format! {
        r#"SELECT id, length FROM vnodes WHERE id IN ({vnodes})"#,
        vnodes=vnodes.iter().map(|vn| vn.to_string()).collect::<Vec<_>>().join(", ")
    }).unwrap();
    let lengths = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let length: usize = row.get(1)?;
        Ok((id, length))
    }).unwrap().map(|item| item.unwrap()).collect::<BTreeMap<i64, usize>>();
    let lengths = vnodes.iter().map(|vn| lengths[vn]).collect::<Vec<_>>();

    // Find the vnode to insert.
    let mut vnode_index = vnodes.len() - 1;
    let mut node_index = 0;
    for (i, length) in lengths.iter().enumerate() {
        if index < node_index + length {
            vnode_index = i;
            break;
        }
        node_index += length;
    }

    // Get the metadata of the vnode to insert.
    let vnode_id = vnodes[vnode_index];
    let (mut vnode_length, mut vnode_nodes): (usize, Vec<i64>) = conn.query_row(
        "SELECT length, nodes FROM vnodes WHERE id = ?",
        [vnode_id],
        |row| {
            let length = row.get(0)?;
            let nodes: String = row.get(1)?;
            Ok((length, serde_json::from_str(&nodes).unwrap()))
        },
    ).unwrap();

    // Insert the node.
    conn.execute(
        "INSERT INTO nodes (value) VALUES (?)",
        [value],
    ).unwrap();
    let node_id = conn.last_insert_rowid();
    vnode_length += 1;
    vnode_nodes.insert(index - node_index, node_id);

    // If the vnode is full, split it.
    if vnode_length > VNODE_SIZE {
        // Insert a new vnode.
        conn.execute(
            "INSERT INTO vnodes (length, nodes) VALUES (?, ?)",
            (vnode_length - (vnode_length / 2), serde_json::to_string(&vnode_nodes[(vnode_length / 2)..]).unwrap()),
        ).unwrap();
        let new_vnode_id = conn.last_insert_rowid();

        // Update the vnode.
        vnode_length = vnode_length / 2;
        vnode_nodes.truncate(vnode_length);
        conn.execute(
            "UPDATE vnodes SET length = ?, nodes = ? WHERE id = ?",
            (vnode_length, serde_json::to_string(&vnode_nodes).unwrap(), vnode_id),
        ).unwrap();

        // Insert the new vnode to the lists' metadata.
        vnodes.insert(vnode_index + 1, new_vnode_id);
        conn.execute(
            "UPDATE lists SET vnodes = ? WHERE id = ?",
            (serde_json::to_string(&vnodes).unwrap(), list_id),
        ).unwrap();
    } else {
        // Update the vnode.
        conn.execute(
            "UPDATE vnodes SET length = ?, nodes = ? WHERE id = ?",
            (vnode_length, serde_json::to_string(&vnode_nodes).unwrap(), vnode_id),
        ).unwrap();
    }
}

fn delitem_list(conn: &Connection, list_id: i64, index: usize) {
    // Get the list's vnodes.
    let mut vnodes: Vec<i64> = conn.query_row(
        "SELECT vnodes FROM lists WHERE id = ?",
        [list_id],
        |row| {
            let vnodes: String = row.get(0)?;
            Ok(serde_json::from_str(&vnodes).unwrap())
        },
    ).unwrap();

    // Get the length of vnodes.
    let mut stmt = conn.prepare(&format! {
        r#"SELECT id, length FROM vnodes WHERE id IN ({vnodes})"#,
        vnodes=vnodes.iter().map(|vn| vn.to_string()).collect::<Vec<_>>().join(", ")
    }).unwrap();
    let lengths = stmt.query_map([], |row| {
        let id: i64 = row.get(0)?;
        let length: usize = row.get(1)?;
        Ok((id, length))
    }).unwrap().map(|item| item.unwrap()).collect::<BTreeMap<i64, usize>>();
    let lengths = vnodes.iter().map(|vn| lengths[vn]).collect::<Vec<_>>();

    // Find the vnode to delete.
    let mut vnode_index = vnodes.len() - 1;
    let mut node_index = 0;
    for (i, length) in lengths.iter().enumerate() {
        if index < node_index + length {
            vnode_index = i;
            break;
        }
        node_index += length;
    }

    // Get the metadata of the vnode to delete.
    let vnode_id = vnodes[vnode_index];
    let (mut vnode_length, mut vnode_nodes): (usize, Vec<i64>) = conn.query_row(
        "SELECT length, nodes FROM vnodes WHERE id = ?",
        [vnode_id],
        |row| {
            let length = row.get(0)?;
            let nodes: String = row.get(1)?;
            Ok((length, serde_json::from_str(&nodes).unwrap()))
        },
    ).unwrap();

    // Delete the node.
    let node_id = vnode_nodes.remove(index - node_index);
    conn.execute(
        "DELETE FROM nodes WHERE id = ?",
        [node_id],
    ).unwrap();
    vnode_length -= 1;

    // If the vnode is empty, merge it.
    if vnode_length == 0 {
        // Remove the vnode from the lists' metadata.
        vnodes.remove(vnode_index);
        conn.execute(
            "UPDATE lists SET vnodes = ? WHERE id = ?",
            (serde_json::to_string(&vnodes).unwrap(), list_id),
        ).unwrap();

        // Delete the vnode.
        conn.execute(
            "DELETE FROM vnodes WHERE id = ?",
            [vnode_id],
        ).unwrap();
    } else {
        // Update the vnode.
        conn.execute(
            "UPDATE vnodes SET length = ?, nodes = ? WHERE id = ?",
            (vnode_length, serde_json::to_string(&vnode_nodes).unwrap(), vnode_id),
        ).unwrap();
    }
}