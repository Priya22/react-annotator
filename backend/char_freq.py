import xml.etree.ElementTree as ET

xmlTree = ET.parse('PrideandPrejudicebyJaneAusten42671.xml')

elemList = []
whos = []
for elem in xmlTree.iter():
  if elem.tag == '{http://www.tei-c.org/ns/1.0}said':
      char = elem.attrib['who']
      whos.append(char[1:])


