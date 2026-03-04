import { Injectable } from '@nestjs/common';

@Injectable()
export class ImageService {
  //
  //     private Map<Long, String> directoryMappings = new HashMap<>();
  //
  //     private final Path baseDirectoryPath;
  //     private final StorageDirectoryService storageDirectoryService;
  //
  //     public FileStorageServiceImpl(FileStorageProperties fileStorageProperties, StorageDirectoryService storageDirectoryService) {
  //         this.baseDirectoryPath = createDirectory(fileStorageProperties.getBaseDirectory());
  //         this.storageDirectoryService = storageDirectoryService;
  //     }
  //
  //     private Path createDirectory(String path) {
  //         Path storagePath = Paths.get(path).toAbsolutePath().normalize();
  //         if (!Files.exists(storagePath)) {
  //             try {
  //                 Files.createDirectories(storagePath);
  //             } catch (IOException e) {
  //                 throw new FileStorageException("Could not create directory: " + storagePath, e);
  //             }
  //         }
  //         return storagePath;
  //     }
  //
  //     private Path normalizePath(Path path) {
  //         Path storagePath = path.toAbsolutePath().normalize();
  //         if (!Files.exists(storagePath)) {
  //             throw new FileStorageException(String.format("Path '%s' not found!", storagePath));
  //         }
  //         return storagePath;
  //     }
  //
  //     @Override
  //     public String saveFileInYourDirectory(MultipartFile file, long storageDirectoryId, String firstName) {
  //
  //         String fileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
  //
  //         if (fileName.contains("..")) {
  //             throw new FileStorageException("Sorry! Filename contains invalid path sequence " + fileName);
  //         }
  //         String directoryName = storageDirectoryService.getEntityById(storageDirectoryId).getStorageName();
  //         Path directoryPath = normalizePath(baseDirectoryPath.resolve(directoryName));
  //         return storeFile(file, directoryPath, firstName, fileName);
  //     }
  //
  //
  //     private String storeFile(MultipartFile file, Path directoryPath, String firstName, String oldName) {
  //         String contentType = Objects.requireNonNull(file.getContentType()).replaceAll("^[a-zA-Z]+/", ".");
  //         if (contentType.equalsIgnoreCase(".mpeg")) contentType = ".mp3";
  //         if (file.getContentType().equals("image/svg+xml")) contentType = ".svg";
  //         String uuidFile = UUID.randomUUID().toString();
  //         String newFileName = firstName + "_" + uuidFile + contentType;
  //         Path targetLocation = directoryPath.resolve(newFileName);
  //         try {
  //             Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
  //             return newFileName;
  //         } catch (IOException e) {
  //             throw new FileStorageException("Could not store file " + oldName + ". Please try again!", e);
  //         }
  //     }
  //
  //     @Override
  //     public String saveWebImage(MultipartFile file) {
  //         var storageOptional = storageDirectoryService.getByStorageName("web_images");
  //         Path pathIsPresent = baseDirectoryPath.resolve("web_images").normalize();
  //         if (!Files.exists(pathIsPresent)) {
  //             createDirectory(baseDirectoryPath.resolve("web_images").toString());
  //         }
  //         Path storagePath = normalizePath(baseDirectoryPath.resolve("web_images"));
  //         if(storageOptional.isEmpty()) storageDirectoryService.createStorageDirectory("web_images");
  //         return storeFile(file, storagePath, "", "web_images");
  //     }
  //
  //     @Override
  //     public Resource loadFileAsResource(String fileName, long storageDirectoryId) {
  //         try {
  //             String directoryName = directoryMappings.get(storageDirectoryId);
  //             if(directoryName == null) {
  //                 directoryName = storageDirectoryService.getEntityById(storageDirectoryId).getStorageName();
  //                 directoryMappings.put(storageDirectoryId, directoryName);
  //             }
  //             Path filePath = normalizePath(baseDirectoryPath.resolve(directoryName).resolve(fileName));
  //             Resource resource = new UrlResource(filePath.toUri());
  //
  //             if (resource.exists()) {
  //                 return resource;
  //             } else {
  //                 throw new MyFileNotFoundException("File not found " + fileName);
  //             }
  //         } catch (MalformedURLException ex) {
  //             throw new FileStorageException("Error load file: " + fileName, ex);
  //         }
  //     }
  //
  //     @Override
  //     public void deleteFileFromStorage(String fileName, long storageDirectoryId) {
  //         String directoryName = storageDirectoryService.getEntityById(storageDirectoryId).getStorageName();
  //         Path subdirectoryPath = normalizePath(baseDirectoryPath.resolve(directoryName));
  //         Path targetLocation = subdirectoryPath.resolve(fileName);
  //
  //         try {
  //             Files.delete(targetLocation);
  //         } catch (IOException e) {
  //             System.out.println("Error in 'deleteFileFromStorage' method! File not found: " + fileName);
  //         }
  //     }
  //    private final Map<String, Path> directoryMappings = new HashMap<>();
  //
  //    public FileStorageService(FileStorageProperties fileStorageProperties) {
  //        directoryMappings.put(fileStorageProperties.getUpload(), createDirectory(fileStorageProperties.getUpload()));
  //        directoryMappings.put(fileStorageProperties.getUploadAudio(), createDirectory(fileStorageProperties.getUploadAudio()));
  //        directoryMappings.put(fileStorageProperties.getUploadUserAvatar(), createDirectory(fileStorageProperties.getUploadUserAvatar()));
  //        directoryMappings.put(fileStorageProperties.getUploadVocabularyPageImage(), createDirectory(fileStorageProperties.getUploadVocabularyPageImage()));
  //        directoryMappings.put(fileStorageProperties.getUploadCategoryImage(), createDirectory(fileStorageProperties.getUploadCategoryImage()));
  //    }
  //    private Path createDirectory(String path) {
  //        Path storagePath = Paths.get(path).toAbsolutePath().normalize();
  //
  //        if (!Files.exists(storagePath)) {
  //            try {
  //                Files.createDirectories(storagePath);
  //            } catch (IOException e) {
  //                throw new FileStorageException("Could not create directory: " + storagePath, e);
  //            }
  //        }
  //        return storagePath;
  //    }
  //    public String storeFile(MultipartFile file, String storagePath, String firstName) throws IOException {
  //        if (directoryMappings.containsKey(storagePath)) {
  //            Path directoryPath = directoryMappings.get(storagePath);
  //            String fileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
  //
  //            if (fileName.contains("..")) {
  //                throw new FileStorageException("Sorry! Filename contains invalid path sequence " + fileName);
  //            }
  //            String contentType = Objects.requireNonNull(file.getContentType()).replaceAll("^[a-zA-Z]+/", ".");
  //            if(contentType.equalsIgnoreCase(".mpeg")) contentType = ".mp3";
  //            String uuidFile = UUID.randomUUID().toString();
  //            String newFileName = firstName + "_" + uuidFile + contentType;
  //            Path targetLocationAudio = directoryPath.resolve(newFileName);
  //            Files.copy(file.getInputStream(), targetLocationAudio, StandardCopyOption.REPLACE_EXISTING);
  //            return newFileName;
  //        } else {
  //            throw new IllegalArgumentException("Invalid directory name: " + storagePath);
  //        }
  //    }
  //    public Resource loadFileAsResource(String fileName, String storagePath) {
  //        try {
  //            Path directoryPath = directoryMappings.get(storagePath);
  //            Path filePath = directoryPath.resolve(fileName).normalize();
  //            Resource resource = new UrlResource(filePath.toUri());
  //            if (resource.exists()) {
  //                return resource;
  //            } else {
  //                throw new MyFileNotFoundException("File not found " + fileName);
  //            }
  //        } catch (MalformedURLException ex) {
  //            throw new FileStorageException("Error load file: " + fileName, ex);
  //        }
  //    }
  //
  //    public void deleteFileFromStorage(String fileName, String storagePath) {
  //        Path directoryPath = directoryMappings.get(storagePath);
  //        Path targetLocation = directoryPath.resolve(fileName);
  //        try {
  //            Files.delete(targetLocation);
  //        } catch (IOException e) {
  ////            throw new RuntimeException("Image not found");
  //            System.out.println("Error in 'deleteFileFromStorage' methods! File not found: " + fileName);
  //        }
  //    }
}
