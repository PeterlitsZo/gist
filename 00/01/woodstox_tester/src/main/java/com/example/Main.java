package com.example;

import java.io.File;

import javax.xml.stream.events.XMLEvent;

import org.codehaus.stax2.XMLInputFactory2;
import org.codehaus.stax2.XMLStreamReader2;

public class Main {
    public static void main(String[] args) {
        String filename = "data/foo.xml";

        try {
            XMLInputFactory2 xmlif2 = (XMLInputFactory2) XMLInputFactory2.newInstance();
            XMLStreamReader2 reader =
                (XMLStreamReader2) xmlif2.createXMLStreamReader(new File(filename));

            // Output: "com.ctc.wstx.sr.ValidatingStreamReader"
            System.out.println(reader.getClass().getName());

            // Output:
            //     + wrapper
            //     |   C '\n    \n'
            //     |   + property
            //     |   |   C '\n    '
            //     |   |   + name
            //     |   |   |   C 'barName'
            //     |   |   - name
            //     |   |   C '\n    '
            //     |   |   + value
            //     |   |   |   C 'barValue'
            //     |   |   - value
            //     |   |   C '\n'
            //     |   - property
            //     |   C '\n'
            //     - wrapper
            int indent = 0;
            while (reader.hasNext()) {
                int eventType = reader.next();
                switch (eventType) {
                    case XMLEvent.START_ELEMENT:
                        for (int i = 0; i < indent; i++) {
                            System.out.print("|   ");
                        }
                        System.out.println("+ " + reader.getLocalName());

                        indent++;

                        break;
                    case XMLEvent.CHARACTERS:
                        String text = reader.getText();
                        if (text.length() > 0) {
                            for (int i = 0; i < indent; i++) {
                                System.out.print("|   ");
                            }
                            System.out.print("C '");
                            for (int i = 0; i < text.length(); i++) {
                                char c = text.charAt(i);
                                if (c == '\n') {
                                    System.out.print("\\n");
                                } else if (c == '\r') {
                                    System.out.print("\\r");
                                } else if (c == '\t') {
                                    System.out.print("\\t");
                                } else {
                                    System.out.print(c);
                                }
                            }
                            System.out.println("'");
                        }
                        break;
                    case XMLEvent.END_ELEMENT:
                        indent--;

                        for (int i = 0; i < indent; i++) {
                            System.out.print("|   ");
                        }

                        System.out.println("- " + reader.getLocalName());

                        break;
                    default:
                        continue;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}