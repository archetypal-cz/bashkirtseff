This is an example of the result of preparations - we take raw OCR'd stream of text by pieces (10 lines), and output a new file for each day, in out example, into /src/_original/01/01.1873-01-11.md - following in tags <example_output></example_output> is the example output for that day:
<example_output>
[//]: # ( Carnet N° 1 )
[//]: # ( 01.01 )

[//]: # ( [Passages reproduits par Pierre Borel dans son article Le visage inconnu de Marie Bashkirtseff d'après ses mémoires, paru dans le N° XLIII de janvier 1925 de la revue Les Œuvres libres]. )
[//]: # ( 01.02 )

[//]: # ( Connaissant la façon dont Pierre Borel concevait les devoirs d'un éditeur de textes nous avions d'abord hésité à publier ce document. Nous nous sommes résolus à les donner après avoir constaté que les événements auxquels Marie dit avoir assisté ont eu lieu aux dates indiquées. )
[//]: # ( 01.03 )

[//]: # ( Du 11 janvier 1873 au 12 février 1873 )
[//]: # ( 01.04 )

[//]: # ( Samedi 11 janvier 1873 )
[//]: # ( 01.05 )

[//]: # ( Les Howard étaient venus me chercher, mais la canaille Mouton ne m'a pas envoyé le cheval.. J'ai fait plusieurs fois le tour en voiture en suivant les chevaux; j'étais en amazone, puis j'ai changé de toilette à la promenade; une délicieuse robe bleue. )
[//]: # ( 01.06 )

[//]: # ( Ce soir, à l'Opéra, "Un ballo in maschera". Beaucoup de monde, mais moi, je suis triste. )
[//]: # ( 01.07 )
</example_output>
We do not delve into other tasks until the entire book is done. 
We rember the id (number of book.number of paragraph) in comment underneath each paragraph. New line between paragraphs. We take the raw OCRd text and the only changes are corrections to fix OCR errors and typos. We must be sure, otherwise we leave a note above that paragraph. If we're going back to files that already contain notes by others, we keep those notes in place exactly as-is, we only edit the text of the original if there is something to update, and our own notes.  

Use tools to only read 10 lines of the raw file at a time so that we don't loose context. We should have the instructions and 10 lines of the file (we can request more lines before and after, to see what day it is or to get the rest of the day.)

Empty lines containing just "|" characters are OCR artifacts.

When you finish 3 days, you create a prompt for the next task, which will include the 