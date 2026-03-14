from database import SessionLocal
import models

def seed_database():
    db = SessionLocal()

    # Check if we already have data to prevent duplicates
    if db.query(models.Module).first():
        print("Database is already seeded!")
        db.close()
        return

    print("Seeding database with initial modules...")

    # 1. Create Modules
    module_vlsi = models.Module(
        title="VLSI Design: ALU Architectures", 
        description="Advanced logic design, verification processes, and implementation of high-speed adders in an Arithmetic Logic Unit."
    )
    module_hv = models.Module(
        title="High Voltage & Current Systems", 
        description="Core principles of high voltage transmission, dielectric breakdown, and high current load analysis."
    )
    
    db.add_all([module_vlsi, module_hv])
    db.commit() # Save to get the IDs

    # 2. Create Lessons (Using raw strings r"" for LaTeX math)
    lessons = [
        models.Lesson(
            module_id=module_vlsi.id,
            title="Adder Architectures in ALU Design",
            content_text="When designing a high-speed ALU, the critical path is often dictated by the adder. Carry-lookahead adders reduce computation time by calculating carry signals in advance, unlike ripple-carry adders.",
            content_math=r"C_{i+1} = G_i + (P_i \cdot C_i)"
        ),
        models.Lesson(
            module_id=module_hv.id,
            title="Dielectric Breakdown in High Voltage",
            content_text="Dielectric breakdown occurs when the electric field applied across an insulator exceeds its dielectric strength, stripping electrons from their atoms and creating a conductive path.",
            content_math=r"E_{bd} = \frac{V_{bd}}{d}"
        )
    ]

    db.add_all(lessons)
    db.commit()

    print("Success! Seeded VLSI and High Voltage modules into the database.")
    db.close()

if __name__ == "__main__":
    seed_database()