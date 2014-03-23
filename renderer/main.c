// libpng
#include <png.h>
// SSBRenderer
#include <ssb.h>
// Others
#include <stdlib.h>
#include <stdio.h>

// Program entry
int main(int argc, char** argv){
    // Declarations
    FILE* file;
    unsigned char header[8], *data;
    png_infop info;
    png_structp png;
    png_uint_32 rowbytes, width, height;
    png_byte depth, color;
    png_bytepp rows;
    char warning[SSB_WARNING_LENGTH];
    ssb_renderer renderer;
    int i;
    // Command line input complete?
    if(argc < 4){
        puts("Not enough command line arguments!\nExpected png image filename, time in milliseconds and SSB script content.");
        return 1;
    }
    // Open input file
    file = fopen(argv[1], "rb");
    if(!file){
        printf("Couldn't open file \"%s\"!\n", argv[1]);
        return 1;
    }
    // File isn't PNG?
    if(fread(header, 1, sizeof(header), file) != sizeof(header) || png_sig_cmp(header, 0, 8)){
        fclose(file);
        printf("File \"%s\" isn't a PNG image!\n", argv[1]);
        return 1;
    }
    // Create PNG read structure
    png = png_create_read_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if(!png){
        fclose(file);
        puts("Couldn't create a PNG read structure!");
        return 1;
    }
    // Create PNG information structure
    info = png_create_info_struct(png);
    if(!info){
        png_destroy_read_struct(&png, NULL, NULL);
        fclose(file);
        puts("Couldn't create a PNG read information structure!");
        return 1;
    }
    // Set jump target on PNG error
    if(setjmp(png_jmpbuf(png))){
        png_destroy_read_struct(&png, &info, NULL);
        fclose(file);
        puts("A PNG read error occured!");
        return 1;
    }
    // Sync file with PNG read structure
    png_init_io(png, file);
    png_set_sig_bytes(png, sizeof(header));
    // Read formatted PNG informations from file
    png_read_png(png, info, PNG_TRANSFORM_STRIP_16 | PNG_TRANSFORM_PACKING | PNG_TRANSFORM_EXPAND | PNG_TRANSFORM_BGR, NULL);
    png_set_interlace_handling(png);
    png_read_update_info(png, info);
    // Get PNG data
    rows = png_get_rows(png, info);
    rowbytes = png_get_rowbytes(png, info);
    width = png_get_image_width(png, info);
    height = png_get_image_height(png, info);
    depth = png_get_bit_depth(png, info);
    color = png_get_color_type(png, info);
    // Check color for successfull transformation
    if(color != PNG_COLOR_TYPE_RGB && color != PNG_COLOR_TYPE_RGBA){
        png_destroy_read_struct(&png, &info, NULL);
        fclose(file);
        puts("Couldn't transform PNG data to BGR(A)!");
        return 1;
    }
    // Set SSB image data
    data = malloc(rowbytes * height);
    if(!data){
        png_destroy_read_struct(&png, &info, NULL);
        fclose(file);
        puts("Couldn't allocate memory for a temporary memory image!");
        return 1;
    }
    for(i = 0; i < height; ++i)
        memcpy(data + (height - 1 - i) * rowbytes, rows[i], rowbytes);
    // Free PNG and file resources
    png_destroy_read_struct(&png, &info, NULL);
    fclose(file);
    // Render on image with SSB
    renderer = ssb_create_renderer_from_memory(width, height, color == PNG_COLOR_TYPE_RGBA ? SSB_BGRA : SSB_BGR, argv[3], warning);
    if(!renderer){
        free(data);
        printf("SSB ERROR\n%s\n", warning);
        return 1;
    }
    ssb_render(renderer, data, rowbytes, atoi(argv[2]));
    ssb_free_renderer(renderer);
    // Open output file
    file = fopen(argv[1], "wb");
    if(!file){
        free(data);
        printf("Couldn't open file \"%s\" for writing!\n", argv[1]);
        return 1;
    }
    // Create PNG write structure
    png = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    if(!png){
        fclose(file);
        free(data);
        puts("Couldn't create a PNG write structure!");
        return 1;
    }
    // Create PNG information structure
    info = png_create_info_struct(png);
    if(!info){
        png_destroy_write_struct(&png, NULL);
        fclose(file);
        free(data);
        puts("Couldn't create a PNG write information structure!");
        return 1;
    }
    // Set jump target on PNG error
    if(setjmp(png_jmpbuf(png))){
        png_destroy_write_struct(&png, &info);
        fclose(file);
        free(data);
        puts("A PNG write error occured!");
        return 1;
    }
    // Sync file with PNG write structure
    png_init_io(png, file);
    // Write PNG informations to file
    png_set_IHDR(png, info, width, height, depth, color, PNG_INTERLACE_NONE, PNG_COMPRESSION_TYPE_DEFAULT, PNG_FILTER_TYPE_DEFAULT);
    png_set_bgr(png);
    png_write_info(png, info);
    // Set PNG data
    for(i = 0; i < height; ++i)
        png_write_row(png, data + (height - 1 - i) * rowbytes);
    // Finish writing to file
    png_write_end(png, info);
    // Free SSB, PNG and file resources
    png_destroy_write_struct(&png, &info);
    fclose(file);
    free(data);
    // Execution success
    return 0;
}
